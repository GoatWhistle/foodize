import asyncio
import json
import logging

from fastapi import WebSocket, WebSocketDisconnect
from uvicorn.protocols.utils import ClientDisconnected

from database import db_helper
from features.notifications.ws_auth import extract_ws_token, resolve_ws_token_user_id
from features.users.dependencies import get_user_by_id
from shared.enums.order_status import OrderStatus

_logger = logging.getLogger(__name__)

_MAX_WS_MESSAGE_BYTES = 4096
_WS_MAX_MESSAGES_PER_WINDOW = 30
_WS_WINDOW_SECONDS = 10.0

TERMINAL_STATUSES = (OrderStatus.COMPLETED.value, OrderStatus.CANCELLED.value)


async def _safe_send_text(websocket: WebSocket, payload: str) -> None:
    try:
        await websocket.send_text(payload)
    except (WebSocketDisconnect, ClientDisconnected):
        raise WebSocketDisconnect


async def _authenticate_ws_user(websocket: WebSocket, token: str | None):
    token = await extract_ws_token(websocket, token)
    if not token:
        await websocket.send_text(json.dumps({"error": "not_authenticated"}))
        await websocket.close()
        return None

    try:
        parsed_user_id = await resolve_ws_token_user_id(token)
    except PermissionError:
        await websocket.send_text(json.dumps({"error": "token_revoked"}))
        await websocket.close()
        return None
    if parsed_user_id is None:
        await websocket.send_text(json.dumps({"error": "invalid_token"}))
        await websocket.close()
        return None

    async with db_helper.session_factory() as session:
        user = await get_user_by_id(session, parsed_user_id)
        if user is None or not user.is_active:
            await websocket.send_text(json.dumps({"error": "not_authenticated"}))
            await websocket.close()
            return None
        return user


async def _consume_client_messages(websocket: WebSocket) -> None:
    window_start = asyncio.get_running_loop().time()
    message_count = 0
    try:
        while True:
            client_message = await websocket.receive_text()

            now = asyncio.get_running_loop().time()
            if now - window_start >= _WS_WINDOW_SECONDS:
                window_start = now
                message_count = 0
            message_count += 1
            if message_count > _WS_MAX_MESSAGES_PER_WINDOW:
                await _safe_send_text(websocket, json.dumps({"error": "rate_limited"}))
                await websocket.close(code=1008)
                return

            if len(client_message.encode("utf-8")) > _MAX_WS_MESSAGE_BYTES:
                await _safe_send_text(websocket, json.dumps({"error": "message_too_large"}))
                continue

            try:
                client_data = json.loads(client_message)
                if client_data.get("type") == "ping":
                    await _safe_send_text(websocket, json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass


async def _run_ws_tasks(*coros) -> None:
    tasks = [asyncio.create_task(coro) for coro in coros]
    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    except asyncio.CancelledError:
        for task in tasks:
            task.cancel()
        raise
    for task in pending:
        task.cancel()
    for task in done:
        if not task.cancelled() and task.exception() is not None:
            _logger.exception("WS task failed", exc_info=task.exception())
