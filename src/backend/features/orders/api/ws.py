import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from database import db_helper
from features.orders.crud.order import get_order_by_id
from features.orders.schemas.order import OrderResponse
from infra.cache.redis import get_redis_cache

router = APIRouter()


@router.websocket("/ws/orders/{order_id}")
async def order_status_ws(
    order_id: uuid.UUID,
    websocket: WebSocket,
) -> None:
    await websocket.accept()
    last_status: str | None = None
    redis_client = get_redis_cache().get_raw_client()
    pubsub = redis_client.pubsub()
    channel = f"order_status:{order_id}"
    await pubsub.subscribe(channel)

    try:
        async with db_helper.session_factory() as session:
            order = await get_order_by_id(session, order_id)
            if order is None:
                await websocket.send_text(json.dumps({"error": "not_found"}))
                return

            last_status = str(order.status)
            data = OrderResponse.model_validate(order).model_dump(mode="json")
            await websocket.send_text(json.dumps(data))

            if last_status in {"COMPLETED", "CANCELLED"}:
                return

        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is not None:
                async with db_helper.session_factory() as session:
                    order = await get_order_by_id(session, order_id)
                    if order is None:
                        break

                    current_status = str(order.status)
                    if current_status != last_status:
                        last_status = current_status
                        data = OrderResponse.model_validate(order).model_dump(mode="json")
                        await websocket.send_text(json.dumps(data))

                    if current_status in {"COMPLETED", "CANCELLED"}:
                        break

    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)


@router.websocket("/ws/restaurants/{restaurant_id}/orders")
async def restaurant_orders_ws(
    restaurant_id: uuid.UUID,
    websocket: WebSocket,
) -> None:
    await websocket.accept()
    redis_client = get_redis_cache().get_raw_client()
    pubsub = redis_client.pubsub()
    channel = f"restaurant_orders:{restaurant_id}"
    await pubsub.subscribe(channel)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is not None:
                data_str = message["data"]
                if isinstance(data_str, bytes):
                    data_str = data_str.decode("utf-8")
                await websocket.send_text(json.dumps({"event": data_str}))
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
