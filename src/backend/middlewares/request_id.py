import re
import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from utils.logging_setup import get_logger

logger = get_logger("foodize.access")

_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,128}$")


def _is_valid_request_id(value: str) -> bool:
    return bool(_REQUEST_ID_RE.match(value))


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get("X-Request-ID")
        request_id = incoming if incoming and _is_valid_request_id(incoming) else str(uuid.uuid4())
        request.state.request_id = request_id

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        if hasattr(request.state, "user") and request.state.user:
            structlog.contextvars.bind_contextvars(user_id=request.state.user.id)

        start = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start) * 1000, 1)
            logger.error(
                "Request failed",
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
                error=repr(exc),
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        logger.info(
            "Request completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
        )
        response.headers["X-Request-ID"] = request_id
        return response
