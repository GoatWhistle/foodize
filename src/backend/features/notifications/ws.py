import contextlib
import json
import uuid

from fastapi import APIRouter, WebSocket
from redis.asyncio.client import PubSub

from shared.ws import authenticate_ws_user, run_channel_ws, safe_send_json, safe_send_text

router = APIRouter(prefix="/ws", tags=["WebSockets"])


async def _forward_notifications(websocket: WebSocket, pubsub: PubSub) -> None:
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        data_str = message["data"]
        if isinstance(data_str, bytes):
            data_str = data_str.decode("utf-8")
        with contextlib.suppress(json.JSONDecodeError):
            await safe_send_json(websocket, json.loads(data_str))


@router.websocket("/notifications/{user_id}")
async def user_notifications_ws(
    user_id: uuid.UUID,
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    await websocket.accept()
    user = await authenticate_ws_user(websocket, token)
    if user is None:
        return
    if user.id != user_id:
        await safe_send_text(websocket, json.dumps({"error": "forbidden"}))
        await websocket.close()
        return

    await safe_send_text(websocket, json.dumps({"type": "connected"}))
    await run_channel_ws(
        websocket,
        f"user_notifications:{user_id}",
        lambda pubsub: _forward_notifications(websocket, pubsub),
    )
