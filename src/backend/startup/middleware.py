from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.exception_handlers import (
    app_exception_handler,
    http_exception_handler,
    integrity_error_handler,
    register_exception_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from middlewares.cache import AutoCacheMiddleware
from middlewares.csrf import CsrfMiddleware
from middlewares.limiter import limiter
from middlewares.request_id import RequestIDMiddleware
from middlewares.security import SecurityHeadersMiddleware
from settings.config.app_config import settings
from shared.exceptions.base import AppException


def configure_middleware(app: FastAPI) -> None:
    app.state.limiter = limiter
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(AutoCacheMiddleware, ttl=300)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(CsrfMiddleware)
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Request-Id",
            "Idempotency-Key",
            settings.auth.csrf_header_name,
        ],
    )
    Instrumentator().instrument(app)


def configure_exception_handlers(app: FastAPI) -> None:
    register_exception_handler(app, RateLimitExceeded, _rate_limit_exceeded_handler)
    register_exception_handler(app, RequestValidationError, request_validation_error_handler)
    register_exception_handler(app, AppException, app_exception_handler)
    register_exception_handler(app, StarletteHTTPException, http_exception_handler)
    register_exception_handler(app, IntegrityError, integrity_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
