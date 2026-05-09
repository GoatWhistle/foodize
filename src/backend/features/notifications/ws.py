import asyncio
import json
import uuid

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from database import db_helper
from features.users.dependencies import get_user_by_id
from infra.cache.redis import get_redis_cache
from utils.JWT import decode_jwt

router = APIRouter(prefix="/ws", tags=["WebSockets"])


@router.websocket("/notifications/{user_id}")
async def user_notifications_ws(
    user_id: uuid.UUID,
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    await websocket.accept()

    if not token:
        await websocket.send_text(json.dumps({"error": "not_authenticated"}))
        await websocket.close()
        return

    try:
        payload = decode_jwt(token)
        token_user_id = uuid.UUID(payload.get("sub", ""))
    except (jwt.InvalidTokenError, ValueError, AttributeError):
        await websocket.send_text(json.dumps({"error": "invalid_token"}))
        await websocket.close()
        return

    if token_user_id != user_id:
        await websocket.send_text(json.dumps({"error": "forbidden"}))
        await websocket.close()
        return

    async with db_helper.session_factory() as session:
        user = await get_user_by_id(session, token_user_id)
        if user is None or not user.is_active:
            await websocket.send_text(json.dumps({"error": "not_authenticated"}))
            await websocket.close()
            return

    redis_client = get_redis_cache().get_raw_client()
    pubsub = redis_client.pubsub()
    channel = f"user_notifications:{user_id}"
    await pubsub.subscribe(channel)
    await websocket.send_text(json.dumps({"type": "connected"}))

    try:

        async def listen_redis():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data_str = message["data"]
                    if isinstance(data_str, bytes):
                        data_str = data_str.decode("utf-8")
                    try:
                        await websocket.send_json(json.loads(data_str))
                    except json.JSONDecodeError:
                        pass

        async def listen_ws():
            try:
                while True:
                    client_message = await websocket.receive_text()
                    try:
                        client_data = json.loads(client_message)
                        if client_data.get("type") == "ping":
                            await websocket.send_text(json.dumps({"type": "pong"}))
                    except json.JSONDecodeError:
                        pass
            except WebSocketDisconnect:
                pass

        t1 = asyncio.create_task(listen_redis())
        t2 = asyncio.create_task(listen_ws())

        done, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
    finally:
        await pubsub.unsubscribe(channel)
