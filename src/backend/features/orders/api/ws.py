import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio.client import PubSub

from database import db_helper
from features.orders.api.ws_helpers import (
    TERMINAL_STATUSES,
    _authenticate_ws_user,
    _consume_client_messages,
    _run_ws_tasks,
    _safe_send_text,
)
from features.orders.crud.order import get_active_orders_for_display, get_order_by_id
from features.orders.dependencies import verify_restaurant_access
from features.orders.schemas.order import OrderResponse
from infra.cache.redis import get_redis_cache
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission
from shared.permissions import has_permission

router = APIRouter()


async def _can_read_order(session, order, user) -> bool:
    if has_permission(user.permissions, Permission.ORDERS_MODERATE):
        return True
    if has_permission(user.permissions, Permission.ORDERS_READ_OWN) and order.user_id == user.id:
        return True
    if has_permission(user.permissions, Permission.ORDERS_READ_RESTAURANT):
        try:
            await verify_restaurant_access(session, order.restaurant_id, user)
            return True
        except Exception:
            return False
    return False


@router.websocket("/ws/orders/{order_id}")
async def order_status_ws(
    order_id: uuid.UUID,
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    await websocket.accept()
    user = await _authenticate_ws_user(websocket, token)
    if user is None:
        return

    redis_client = get_redis_cache().get_raw_client()

    async with db_helper.session_factory() as session:
        order = await get_order_by_id(session, order_id)
        if order is None:
            await websocket.send_text(json.dumps({"error": "not_found"}))
            await websocket.close()
            return
        if not await _can_read_order(session, order, user):
            await websocket.send_text(json.dumps({"error": "forbidden"}))
            await websocket.close()
            return

        last_status = str(order.status)
        data = OrderResponse.model_validate(order).model_dump(mode="json")
        await _safe_send_text(websocket, json.dumps(data))

        if last_status in TERMINAL_STATUSES:
            return

    pubsub = redis_client.pubsub()
    channel = f"order_status:{order_id}"
    await pubsub.subscribe(channel)

    try:
        await _run_ws_tasks(
            _order_status_pubsub_loop(websocket, pubsub, order_id, last_status),
            _consume_client_messages(websocket),
        )
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()


async def _order_status_pubsub_loop(
    websocket: WebSocket,
    pubsub: PubSub,
    order_id: uuid.UUID,
    last_status: str,
) -> None:
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue

        new_status = message["data"]
        if isinstance(new_status, bytes):
            new_status = new_status.decode("utf-8")
        if new_status == last_status:
            continue

        async with db_helper.session_factory() as session:
            order = await get_order_by_id(session, order_id)
            if order is None:
                return
            last_status = str(order.status)
            data = OrderResponse.model_validate(order).model_dump(mode="json")

        await _safe_send_text(websocket, json.dumps(data))
        if last_status in TERMINAL_STATUSES:
            return


def _build_display_board(rows: list[tuple[int, str]]) -> dict:
    cooking_statuses = {
        OrderStatus.PENDING.value,
        OrderStatus.ACCEPTED.value,
    }
    cooking = [display_id for display_id, status in rows if status in cooking_statuses]
    ready = [display_id for display_id, status in rows if status == OrderStatus.READY.value]
    return {"cooking": cooking, "ready": ready}


@router.websocket("/ws/restaurants/{restaurant_id}/display-board")
async def display_board_ws(
    restaurant_id: uuid.UUID,
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    await websocket.accept()
    user = await _authenticate_ws_user(websocket, token)
    if user is None:
        return

    async with db_helper.session_factory() as session:
        if not has_permission(user.permissions, Permission.DISPLAY_BOARD_VIEW):
            await websocket.send_text(json.dumps({"error": "forbidden"}))
            await websocket.close()
            return

        try:
            await verify_restaurant_access(session, restaurant_id, user)
        except Exception:
            await websocket.send_text(json.dumps({"error": "forbidden"}))
            await websocket.close()
            return

        rows = await get_active_orders_for_display(session, restaurant_id)
        await _safe_send_text(websocket, json.dumps(_build_display_board(rows)))

    redis_client = get_redis_cache().get_raw_client()
    pubsub = redis_client.pubsub()
    channel = f"restaurant_orders:{restaurant_id}"
    await pubsub.subscribe(channel)

    try:
        await _run_ws_tasks(
            _display_board_pubsub_loop(websocket, pubsub, restaurant_id),
            _consume_client_messages(websocket),
        )
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()


async def _display_board_pubsub_loop(
    websocket: WebSocket,
    pubsub: PubSub,
    restaurant_id: uuid.UUID,
) -> None:
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        async with db_helper.session_factory() as session:
            rows = await get_active_orders_for_display(session, restaurant_id)
        await _safe_send_text(websocket, json.dumps(_build_display_board(rows)))


@router.websocket("/ws/restaurants/{restaurant_id}/orders")
async def restaurant_orders_ws(
    restaurant_id: uuid.UUID,
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    await websocket.accept()
    user = await _authenticate_ws_user(websocket, token)
    if user is None:
        return

    async with db_helper.session_factory() as session:
        try:
            await verify_restaurant_access(session, restaurant_id, user)
        except Exception:
            await websocket.send_text(json.dumps({"error": "forbidden"}))
            await websocket.close()
            return

    redis_client = get_redis_cache().get_raw_client()
    pubsub = redis_client.pubsub()
    channel = f"restaurant_orders:{restaurant_id}"
    await pubsub.subscribe(channel)

    try:
        await _run_ws_tasks(
            _restaurant_orders_pubsub_loop(websocket, pubsub),
            _consume_client_messages(websocket),
        )
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()


async def _restaurant_orders_pubsub_loop(
    websocket: WebSocket,
    pubsub: PubSub,
) -> None:
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        data_str = message["data"]
        if isinstance(data_str, bytes):
            data_str = data_str.decode("utf-8")
        await _safe_send_text(websocket, json.dumps({"event": data_str}))
