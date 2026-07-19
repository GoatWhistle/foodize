import asyncio
import json
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import WebSocketDisconnect
from uvicorn.protocols.utils import ClientDisconnected

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ws_test_helpers import FakeWebSocket, _empty_pubsub, make_redis_cache

from shared import ws as ws_module
from shared.ws import (
    authenticate_ws_user,
    consume_client_messages,
    run_channel_ws,
    run_ws_tasks,
    safe_send_json,
    safe_send_text,
    subscribed_pubsub,
)


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


class TestRunWsTasks:
    async def test_cancels_pending_when_first_completes(self) -> None:
        completed = asyncio.Event()

        async def _fast() -> None:
            completed.set()

        async def _slow() -> None:
            await asyncio.sleep(10)

        await run_ws_tasks(_fast(), _slow())
        assert completed.is_set()

    async def test_logs_task_exception(self) -> None:
        async def _boom() -> None:
            raise RuntimeError("bad")

        async def _slow() -> None:
            await asyncio.sleep(10)

        with patch.object(ws_module._logger, "exception") as log_exc:
            await run_ws_tasks(_boom(), _slow())
        log_exc.assert_called()

    async def test_propagates_cancellation(self) -> None:
        started = asyncio.Event()

        async def _blocker() -> None:
            started.set()
            await asyncio.sleep(10)

        task = asyncio.create_task(run_ws_tasks(_blocker(), _blocker()))
        await started.wait()
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task


class TestSubscribedPubsub:
    async def test_subscribes_and_cleans_up(self) -> None:
        pubsub = _empty_pubsub()
        cache = make_redis_cache(pubsub)
        with patch("shared.ws.get_redis_cache", return_value=cache):
            async with subscribed_pubsub("chan") as ps:
                assert ps is pubsub
        pubsub.subscribe.assert_awaited_once_with("chan")
        pubsub.unsubscribe.assert_awaited_once_with("chan")
        pubsub.aclose.assert_awaited_once()


class TestRunChannelWs:
    async def test_runs_producer_and_consumer(self) -> None:
        pubsub = _empty_pubsub()
        cache = make_redis_cache(pubsub)
        websocket = FakeWebSocket()

        produced = asyncio.Event()

        async def _producer(_: object) -> None:
            produced.set()

        with patch("shared.ws.get_redis_cache", return_value=cache):
            await run_channel_ws(websocket, "chan", _producer)

        assert produced.is_set()
        pubsub.unsubscribe.assert_awaited_once()


class TestAuthenticateWsUser:
    async def test_no_token_closes(self) -> None:
        websocket = FakeWebSocket()
        with patch("shared.ws.extract_ws_token", new_callable=AsyncMock, return_value=None):
            result = await authenticate_ws_user(websocket, None)
        assert result is None
        assert websocket.closed
        assert websocket.first_message() == {"error": "not_authenticated"}

    async def test_revoked_token_closes(self) -> None:
        websocket = FakeWebSocket()
        with (
            patch("shared.ws.extract_ws_token", new_callable=AsyncMock, return_value="t"),
            patch(
                "shared.ws.resolve_ws_token_user_id",
                new_callable=AsyncMock,
                side_effect=PermissionError,
            ),
        ):
            result = await authenticate_ws_user(websocket, "t")
        assert result is None
        assert websocket.first_message() == {"error": "token_revoked"}

    async def test_invalid_token_closes(self) -> None:
        websocket = FakeWebSocket()
        with (
            patch("shared.ws.extract_ws_token", new_callable=AsyncMock, return_value="t"),
            patch(
                "shared.ws.resolve_ws_token_user_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
        ):
            result = await authenticate_ws_user(websocket, "t")
        assert result is None
        assert websocket.first_message() == {"error": "invalid_token"}

    async def test_inactive_user_closes(self) -> None:
        websocket = FakeWebSocket()
        user = MagicMock()
        user.is_active = False
        session_ctx = MagicMock()
        session_ctx.__aenter__ = AsyncMock(return_value=AsyncMock())
        session_ctx.__aexit__ = AsyncMock(return_value=None)
        with (
            patch("shared.ws.extract_ws_token", new_callable=AsyncMock, return_value="t"),
            patch(
                "shared.ws.resolve_ws_token_user_id",
                new_callable=AsyncMock,
                return_value=uuid.uuid4(),
            ),
            patch("shared.ws.db_helper.session_factory", return_value=session_ctx),
            patch("shared.ws.get_user_by_id", new_callable=AsyncMock, return_value=user),
        ):
            result = await authenticate_ws_user(websocket, "t")
        assert result is None
        assert websocket.first_message() == {"error": "not_authenticated"}

    async def test_active_user_returned(self) -> None:
        websocket = FakeWebSocket()
        user = MagicMock()
        user.is_active = True
        session_ctx = MagicMock()
        session_ctx.__aenter__ = AsyncMock(return_value=AsyncMock())
        session_ctx.__aexit__ = AsyncMock(return_value=None)
        uid = uuid.uuid4()
        with (
            patch("shared.ws.extract_ws_token", new_callable=AsyncMock, return_value="t"),
            patch(
                "shared.ws.resolve_ws_token_user_id",
                new_callable=AsyncMock,
                return_value=uid,
            ),
            patch("shared.ws.db_helper.session_factory", return_value=session_ctx),
            patch("shared.ws.get_user_by_id", new_callable=AsyncMock, return_value=user),
        ):
            result = await authenticate_ws_user(websocket, "t")
        assert result is user
        assert not websocket.closed
