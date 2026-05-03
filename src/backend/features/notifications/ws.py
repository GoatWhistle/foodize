import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from infra.cache.redis import get_redis_cache

router = APIRouter(prefix="/ws", tags=["WebSockets"])


@router.websocket("/users/{user_id}/notifications")
async def user_notifications_ws(
    user_id: uuid.UUID,
    websocket: WebSocket,
) -> None:
    await websocket.accept()
    redis_client = get_redis_cache().get_raw_client()
    pubsub = redis_client.pubsub()
    channel = f"user_notifications:{user_id}"
    await pubsub.subscribe(channel)

    try:
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )
            if message is not None:
                data_str = message["data"]
                if isinstance(data_str, bytes):
                    data_str = data_str.decode("utf-8")

                try:
                    payload = json.loads(data_str)
                    await websocket.send_json(payload)
                except json.JSONDecodeError:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
