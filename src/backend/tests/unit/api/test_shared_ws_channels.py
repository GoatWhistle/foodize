import asyncio
import sys
import uuid
from pathlib import Path
from typing import cast
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ws_test_helpers import FakeWebSocket, empty_pubsub, make_redis_cache

from shared import ws as ws_module
from shared.ws import authenticate_ws_user, run_channel_ws, run_ws_tasks, subscribed_pubsub


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
        pubsub = empty_pubsub()
        cache = make_redis_cache(pubsub)
        with patch("shared.ws.get_redis_cache", return_value=cache):
            async with subscribed_pubsub("chan") as ps:
                assert ps is pubsub
        mocked = cast("MagicMock", pubsub)
        mocked.subscribe.assert_awaited_once_with("chan")
        mocked.unsubscribe.assert_awaited_once_with("chan")
        mocked.aclose.assert_awaited_once()


class TestRunChannelWs:
    async def test_runs_producer_and_consumer(self) -> None:
        pubsub = empty_pubsub()
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
