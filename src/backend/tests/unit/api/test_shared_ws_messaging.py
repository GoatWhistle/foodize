import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import WebSocketDisconnect
from uvicorn.protocols.utils import ClientDisconnected

sys.path.insert(0, str(Path(__file__).resolve().parent))

from shared import ws as ws_module
from shared.ws import consume_client_messages, safe_send_json, safe_send_text


class TestSafeSendText:
    async def test_sends_payload(self) -> None:
        websocket = MagicMock()
        websocket.send_text = AsyncMock()
        await safe_send_text(websocket, "hello")
        websocket.send_text.assert_awaited_once_with("hello")

    async def test_reraises_disconnect(self) -> None:
        websocket = MagicMock()
        websocket.send_text = AsyncMock(side_effect=ClientDisconnected())
        with pytest.raises(WebSocketDisconnect):
            await safe_send_text(websocket, "hello")

    async def test_timeout_becomes_disconnect(self) -> None:
        websocket = MagicMock()

        async def _slow(_: str) -> None:
            await asyncio.sleep(1)

        websocket.send_text = _slow
        with (
            patch.object(ws_module, "WS_SEND_TIMEOUT_SECONDS", 0.01),
            pytest.raises(WebSocketDisconnect),
        ):
            await safe_send_text(websocket, "hello")

    async def test_safe_send_json_serializes(self) -> None:
        websocket = MagicMock()
        websocket.send_text = AsyncMock()
        await safe_send_json(websocket, {"a": 1})
        sent = websocket.send_text.await_args.args[0]
        assert json.loads(sent) == {"a": 1}


class TestConsumeClientMessages:
    async def test_returns_on_disconnect(self) -> None:
        websocket = MagicMock()
        websocket.receive_text = AsyncMock(side_effect=WebSocketDisconnect())
        await consume_client_messages(websocket)

    async def test_responds_pong_to_ping(self) -> None:
        websocket = MagicMock()
        websocket.receive_text = AsyncMock(
            side_effect=[json.dumps({"type": "ping"}), WebSocketDisconnect()]
        )
        websocket.send_text = AsyncMock()
        await consume_client_messages(websocket)
        sent = [json.loads(c.args[0]) for c in websocket.send_text.await_args_list]
        assert {"type": "pong"} in sent

    async def test_ignores_invalid_json(self) -> None:
        websocket = MagicMock()
        websocket.receive_text = AsyncMock(side_effect=["{not json", WebSocketDisconnect()])
        websocket.send_text = AsyncMock()
        await consume_client_messages(websocket)
        websocket.send_text.assert_not_awaited()

    async def test_rejects_oversized_message(self) -> None:
        websocket = MagicMock()
        big = "x" * (ws_module.MAX_WS_MESSAGE_BYTES + 1)
        websocket.receive_text = AsyncMock(side_effect=[big, WebSocketDisconnect()])
        websocket.send_text = AsyncMock()
        await consume_client_messages(websocket)
        sent = [json.loads(c.args[0]) for c in websocket.send_text.await_args_list]
        assert {"error": "message_too_large"} in sent

    async def test_rate_limits_and_closes(self) -> None:
        websocket = MagicMock()
        messages = [json.dumps({"type": "x"})] * (ws_module.WS_MAX_MESSAGES_PER_WINDOW + 1)
        websocket.receive_text = AsyncMock(side_effect=messages)
        websocket.send_text = AsyncMock()
        websocket.close = AsyncMock()
        await consume_client_messages(websocket)
        websocket.close.assert_awaited_once_with(code=1008)
        sent = [json.loads(c.args[0]) for c in websocket.send_text.await_args_list]
        assert {"error": "rate_limited"} in sent

    async def test_window_resets_after_interval(self) -> None:
        websocket = MagicMock()
        times = iter([0.0, 0.0, 100.0, 100.0])

        loop = MagicMock()
        loop.time = MagicMock(side_effect=lambda: next(times))

        websocket.receive_text = AsyncMock(
            side_effect=[
                json.dumps({"type": "a"}),
                json.dumps({"type": "b"}),
                WebSocketDisconnect(),
            ]
        )
        websocket.send_text = AsyncMock()
        with patch("shared.ws.asyncio.get_running_loop", return_value=loop):
            await consume_client_messages(websocket)
