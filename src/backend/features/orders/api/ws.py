import asyncio
import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from database import db_helper
from features.orders.crud.order import get_order_by_id
from features.orders.schemas.order import OrderResponse

router = APIRouter()

_POLL_INTERVAL = 2


@router.websocket("/ws/orders/{order_id}")
async def order_status_ws(
    order_id: uuid.UUID,
    websocket: WebSocket,
) -> None:
    await websocket.accept()
    last_status: str | None = None

    try:
        async with db_helper.session_factory() as session:
            while True:
                order = await get_order_by_id(session, order_id)
                if order is None:
                    await websocket.send_text(json.dumps({"error": "not_found"}))
                    break

                current_status = str(order.status)
                if current_status != last_status:
                    last_status = current_status
                    data = OrderResponse.model_validate(order).model_dump(mode="json")
                    await websocket.send_text(json.dumps(data))

                if current_status in {"COMPLETED", "CANCELLED"}:
                    break

                await asyncio.sleep(_POLL_INTERVAL)
    except WebSocketDisconnect:
        pass
