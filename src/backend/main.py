import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from http import HTTPStatus
from secrets import compare_digest

import uvicorn
from fastapi import FastAPI, Header
from fastapi import Response as FastAPIResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from api import router as api_router
from api.exception_handlers import (
    app_exception_handler,
    http_exception_handler,
    integrity_error_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from database import db_helper
from features.ai_order_agent.crud import get_embedding_column_dim
from features.notifications.broker import broker
from infra.cache.redis import close_redis_pool, get_redis_cache
from middlewares.cache import AutoCacheMiddleware
from middlewares.limiter import limiter
from middlewares.request_id import RequestIDMiddleware
from middlewares.security import SecurityHeadersMiddleware
from settings.config.app_config import settings
from shared.exceptions.base import AppException
from utils.logging_setup import configure_logging, get_logger

configure_logging()

logger = get_logger(__name__)


async def _verify_embedding_dim() -> None:
    try:
        async with db_helper.session_factory() as session:
            column_dim = await get_embedding_column_dim(session)
    except Exception as exc:
        logger.warning("embedding_dim_check_skipped", error=repr(exc))
        return
    if column_dim is None:
        logger.warning("embedding_dim_check_skipped reason=column_missing")
        return
    configured_dim = settings.llm.embedding_dim
    if column_dim != configured_dim:
        raise RuntimeError(
            "LLM__EMBEDDING_DIM mismatch: menu_item_embeddings.embedding column has "
            f"dim={column_dim} but settings.llm.embedding_dim={configured_dim}. "
            "Run the matching migration or align the config before starting."
        )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.debug:
        logger.warning(
            "Application is running with debug=True: production security guards "
            "(insecure default credentials, weak secrets, docs exposure) are DISABLED."
        )
    if settings.rabbitmq.is_default_insecure and not settings.debug:
        raise RuntimeError(
            "RABBITMQ__URL must be set to a non-default value in production. "
            "Current value uses insecure default credentials."
        )
    if not settings.redis.password and not settings.debug:
        raise RuntimeError(
            "REDIS__PASSWORD must be set to a non-empty value in production. "
            "Current value is empty, which allows unauthenticated Redis access."
        )
    if settings.telegram.is_weak_bot_api_secret and not settings.debug:
        raise RuntimeError(
            "TELEGRAM__BOT_API_SECRET must be set to a strong random value in production. "
            "Current value is empty or a known weak placeholder."
        )
    if settings.s3.is_default_insecure and not settings.debug:
        raise RuntimeError(
            "S3__ACCESS_KEY / S3__SECRET_KEY must be set to non-default values in production. "
            "Current value uses insecure default 'minioadmin' credentials."
        )
    if "*" in settings.cors.allowed_origins:
        raise RuntimeError(
            "CORS__ALLOWED_ORIGINS must not contain a wildcard '*' because the app is "
            "configured with allow_credentials=True. Browsers reject this combination, "
            "so a wildcard origin silently breaks all cross-origin requests. "
            "List explicit allowed origins instead."
        )
    if settings.llm.embeddings_enabled:
        await _verify_embedding_dim()
    await broker.connect()
    yield
    logger.info("application_shutdown_started")
    await broker.disconnect()
    await close_redis_pool()
    await db_helper.dispose()
    logger.info("application_shutdown_complete")


app = FastAPI(
    title="Foodize API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)
app.state.limiter = limiter

app.add_middleware(RequestIDMiddleware)
app.add_middleware(AutoCacheMiddleware, ttl=300)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-Id", "Idempotency-Key"],
)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.add_exception_handler(RequestValidationError, request_validation_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(IntegrityError, integrity_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, unhandled_exception_handler)
app.include_router(api_router)

instrumentator = Instrumentator().instrument(app)


@app.get("/metrics", include_in_schema=False)
async def metrics(authorization: str | None = Header(default=None)) -> FastAPIResponse:
    token = settings.run.metrics_token
    if token:
        expected = f"Bearer {token}"
        if not authorization or not compare_digest(authorization, expected):
            return FastAPIResponse(status_code=HTTPStatus.UNAUTHORIZED)
    return FastAPIResponse(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/ping")
async def ping() -> dict[str, str]:
    return {"status": "pong"}


@app.get("/api/live")
async def live() -> dict[str, str]:
    return {"status": "alive"}


async def _check_database() -> str:
    try:
        async with db_helper.session_factory() as session:
            await session.execute(text("SELECT 1"))
        return "ok"
    except Exception as exc:
        logger.warning("health_check_failed", component="db", error=repr(exc))
        return "error"


async def _check_redis() -> str:
    try:
        await get_redis_cache().exists("health")
        return "ok"
    except Exception as exc:
        logger.warning("health_check_failed", component="redis", error=repr(exc))
        return "error"


async def _check_rabbitmq() -> str:
    try:
        return "ok" if broker.is_connected else "error"
    except Exception as exc:
        logger.warning("health_check_failed", component="rabbitmq", error=repr(exc))
        return "error"


async def _dependency_checks() -> tuple[str, dict[str, str]]:
    db_status, redis_status, rabbitmq_status = await asyncio.gather(
        _check_database(), _check_redis(), _check_rabbitmq()
    )
    checks = {"db": db_status, "redis": redis_status, "rabbitmq": rabbitmq_status}
    overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return overall, checks


@app.get("/api/health")
async def health() -> JSONResponse:
    overall, checks = await _dependency_checks()
    status_code = HTTPStatus.OK if overall == "ok" else HTTPStatus.SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content={"status": overall, "checks": checks})


@app.get("/api/ready")
async def ready() -> JSONResponse:
    overall, checks = await _dependency_checks()
    status_code = HTTPStatus.OK if overall == "ok" else HTTPStatus.SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content={"status": overall, "checks": checks})


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.run.host,
        port=settings.run.port,
        timeout_graceful_shutdown=30,
    )
