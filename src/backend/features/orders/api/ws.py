import json
import uuid

from fastapi import APIRouter, WebSocket
from pydantic import JsonValue
from redis.asyncio.client import PubSub
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.orders.api.order import verify_order_read_access
from features.orders.crud.order import get_active_orders_for_display, get_order_by_id
from features.orders.dependencies import verify_restaurant_access
from features.orders.models import Order
from features.orders.schemas.order import OrderResponse
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission
from shared.exceptions import AppException
from shared.permissions import has_permission
from shared.ws import authenticate_ws_user as _authenticate_ws_user
from shared.ws import run_channel_ws
from shared.ws import safe_send_text as _safe_send_text

TERMINAL_STATUSES = (OrderStatus.COMPLETED.value, OrderStatus.CANCELLED.value)

router = APIRouter()


async def can_read_order(session: AsyncSession, order: Order, user: User) -> bool:
    try:
        await verify_order_read_access(session, order, user)
        return True
    except AppException:
        return False


async def _verify_restaurant_access_or_close(
    websocket: WebSocket, session: AsyncSession, restaurant_id: uuid.UUID, user: User
) -> bool:
    try:
        await verify_restaurant_access(session, restaurant_id, user)
        return True
    except AppException:
        await websocket.send_text(json.dumps({"error": "forbidden"}))
        await websocket.close()
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

    async with db_helper.session_factory() as session:
        order = await get_order_by_id(session, order_id)
        if order is None:
            await websocket.send_text(json.dumps({"error": "not_found"}))
            await websocket.close()
            return
        if not await can_read_order(session, order, user):
            await websocket.send_text(json.dumps({"error": "forbidden"}))
            await websocket.close()
            return

        last_status = str(order.status)
        data = OrderResponse.model_validate(order).model_dump(mode="json")
        await _safe_send_text(websocket, json.dumps(data))

        if last_status in TERMINAL_STATUSES:
            return

    await run_channel_ws(
        websocket,
        f"order_status:{order_id}",
        lambda pubsub: order_status_pubsub_loop(websocket, pubsub, order_id, last_status),
    )


async def order_status_pubsub_loop(
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


def build_display_board(rows: list[tuple[int, str]]) -> dict[str, JsonValue]:
    cooking_statuses = {
        OrderStatus.PENDING.value,
        OrderStatus.ACCEPTED.value,
    }
    cooking: list[JsonValue] = [
        display_id for display_id, status in rows if status in cooking_statuses
    ]
    ready: list[JsonValue] = [
        display_id for display_id, status in rows if status == OrderStatus.READY.value
    ]
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

        if not await _verify_restaurant_access_or_close(websocket, session, restaurant_id, user):
            return

        rows = await get_active_orders_for_display(session, restaurant_id)
        await _safe_send_text(websocket, json.dumps(build_display_board(rows)))

    await run_channel_ws(
        websocket,
        f"restaurant_orders:{restaurant_id}",
        lambda pubsub: _display_board_pubsub_loop(websocket, pubsub, restaurant_id),
    )


_DISPLAY_BOARD_COALESCE_SECONDS = 0.3


async def _drain_pending_messages(pubsub: PubSub) -> None:
    while True:
        pending = await pubsub.get_message(
            ignore_subscribe_messages=True, timeout=_DISPLAY_BOARD_COALESCE_SECONDS
        )
        if pending is None:
            return


async def _display_board_pubsub_loop(
    websocket: WebSocket,
    pubsub: PubSub,
    restaurant_id: uuid.UUID,
) -> None:
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        await _drain_pending_messages(pubsub)
        async with db_helper.session_factory() as session:
            rows = await get_active_orders_for_display(session, restaurant_id)
        await _safe_send_text(websocket, json.dumps(build_display_board(rows)))


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
        if not await _verify_restaurant_access_or_close(websocket, session, restaurant_id, user):
            return

    await run_channel_ws(
        websocket,
        f"restaurant_orders:{restaurant_id}",
        lambda pubsub: restaurant_orders_pubsub_loop(websocket, pubsub),
    )


async def restaurant_orders_pubsub_loop(
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
