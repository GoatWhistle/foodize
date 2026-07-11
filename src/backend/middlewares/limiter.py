from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from utils.jwt_tokens import decode_jwt


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("authorization")
    if header and header.lower().startswith("bearer "):
        return header[7:].strip()
    return None


def user_or_ip_key(request: Request) -> str:
    token = request.cookies.get("access_token") or _bearer_token(request)
    if token:
        try:
            payload = decode_jwt(token)
        except Exception:
            payload = None
        if payload and payload.get("sub"):
            return f"user:{payload['sub']}"
    return f"ip:{_client_ip(request)}"


limiter = Limiter(key_func=_client_ip, default_limits=["100/minute"])
