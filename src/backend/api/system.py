import asyncio
from http import HTTPStatus
from secrets import compare_digest

from fastapi import APIRouter, Header
from fastapi import Response as FastAPIResponse
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text

from database import db_helper
from features.notifications.broker import broker
from infra.cache.redis import get_redis_cache
from settings.config.app_config import settings
from utils.logging_setup import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/metrics", include_in_schema=False)
async def metrics(authorization: str | None = Header(default=None)) -> FastAPIResponse:
    token = settings.run.metrics_token
    if token:
        expected = f"Bearer {token}"
        if not authorization or not compare_digest(authorization, expected):
            return FastAPIResponse(status_code=HTTPStatus.UNAUTHORIZED)
    return FastAPIResponse(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@router.get("/api/ping")
async def ping() -> dict[str, str]:
    return {"status": "pong"}


@router.get("/api/live")
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


@router.get("/api/health")
async def health() -> JSONResponse:
    overall, checks = await _dependency_checks()
    status_code = HTTPStatus.OK if overall == "ok" else HTTPStatus.SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content={"status": overall, "checks": checks})


@router.get("/api/ready")
async def ready() -> JSONResponse:
    overall, checks = await _dependency_checks()
    status_code = HTTPStatus.OK if overall == "ok" else HTTPStatus.SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content={"status": overall, "checks": checks})
