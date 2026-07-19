from http import HTTPStatus
from secrets import compare_digest

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from settings.config.app_config import settings

_SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})
_EXEMPT_PATH_MARKERS = ("/telegram/bot/",)


def _is_exempt_path(path: str) -> bool:
    return any(marker in path for marker in _EXEMPT_PATH_MARKERS)


def _uses_cookie_auth(request: Request) -> bool:
    if request.headers.get("authorization"):
        return False
    return bool(request.cookies.get("access_token") or request.cookies.get("refresh_token"))


class CsrfMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in _SAFE_METHODS or _is_exempt_path(request.url.path):
            return await call_next(request)
        if not _uses_cookie_auth(request):
            return await call_next(request)

        cookie_token = request.cookies.get(settings.auth.csrf_cookie_name)
        header_token = request.headers.get(settings.auth.csrf_header_name)
        if not cookie_token or not header_token or not compare_digest(cookie_token, header_token):
            return JSONResponse(
                status_code=HTTPStatus.FORBIDDEN,
                content={"detail": "CSRF token missing or invalid"},
            )
        return await call_next(request)
