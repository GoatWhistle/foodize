import asyncio
import json
import uuid

import jwt
from fastapi import WebSocket, WebSocketDisconnect
from uvicorn.protocols.utils import ClientDisconnected

from infra.cache.redis import get_redis_cache
from utils.jwt_tokens import decode_jwt

_ACCESS_BLACKLIST_PREFIX = "access_blacklist:"


async def extract_ws_token(websocket: WebSocket, token: str | None) -> str | None:
    if not token:
        token = websocket.cookies.get("access_token")
    if not token:
        try:
            raw = await asyncio.wait_for(websocket.receive_text(), timeout=3.0)
            data = json.loads(raw)
            token = data.get("token") if isinstance(data, dict) else None
        except (
            asyncio.TimeoutError,
            json.JSONDecodeError,
            WebSocketDisconnect,
            ClientDisconnected,
        ):
            token = None
    return token


async def resolve_ws_token_user_id(token: str) -> uuid.UUID | None:
    try:
        payload = decode_jwt(token)
        if payload.get("typ") != "access":
            raise ValueError("wrong token type")
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError
        parsed_user_id = uuid.UUID(user_id)
    except (jwt.InvalidTokenError, ValueError, AttributeError):
        return None

    jti = payload.get("jti")
    if jti:
        cache = get_redis_cache()
        if await cache.exists(f"{_ACCESS_BLACKLIST_PREFIX}{jti}"):
            raise PermissionError("token_revoked")
    return parsed_user_id
