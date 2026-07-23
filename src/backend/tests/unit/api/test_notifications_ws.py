import json
import sys
import uuid
from collections.abc import AsyncIterator
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ws_test_helpers import FakeWebSocket

from features.notifications.ws import forward_notifications, user_notifications_ws


class TestForwardNotifications:
    async def test_forwards_message_events(self) -> None:
        websocket = MagicMock()

        async def _listen() -> AsyncIterator[dict[str, object]]:
            yield {"type": "message", "data": json.dumps({"n": 1})}
            yield {"type": "subscribe", "data": "1"}
            yield {"type": "message", "data": b'{"n": 2}'}

        pubsub = MagicMock()
        pubsub.listen = MagicMock(return_value=_listen())

        with patch("features.notifications.ws.safe_send_json", new_callable=AsyncMock) as send_json:
            await forward_notifications(websocket, pubsub)

        assert send_json.await_count == 2
        assert send_json.await_args_list[0].args[1] == {"n": 1}
        assert send_json.await_args_list[1].args[1] == {"n": 2}

    async def test_skips_invalid_json(self) -> None:
        websocket = MagicMock()

        async def _listen() -> AsyncIterator[dict[str, object]]:
            yield {"type": "message", "data": "{not json"}

        pubsub = MagicMock()
        pubsub.listen = MagicMock(return_value=_listen())

        with patch("features.notifications.ws.safe_send_json", new_callable=AsyncMock) as send_json:
            await forward_notifications(websocket, pubsub)

        send_json.assert_not_awaited()


class TestUserNotificationsWs:
    async def test_unauthenticated_returns(self) -> None:
        websocket = FakeWebSocket()
        with patch(
            "features.notifications.ws.authenticate_ws_user",
            new_callable=AsyncMock,
            return_value=None,
        ):
            await user_notifications_ws(uuid.uuid4(), websocket, token=None)
        assert websocket.accepted

    async def test_user_mismatch_forbidden(self) -> None:
        websocket = FakeWebSocket()
        user = MagicMock()
        user.id = uuid.uuid4()
        with patch(
            "features.notifications.ws.authenticate_ws_user",
            new_callable=AsyncMock,
            return_value=user,
        ):
            await user_notifications_ws(uuid.uuid4(), websocket, token="t")
        assert websocket.first_message() == {"error": "forbidden"}
        assert websocket.closed

    async def test_matching_user_runs_channel(self) -> None:
        websocket = FakeWebSocket()
        user = MagicMock()
        user.id = uuid.uuid4()
        run_channel = AsyncMock()
        with (
            patch(
                "features.notifications.ws.authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("features.notifications.ws.run_channel_ws", run_channel),
        ):
            await user_notifications_ws(user.id, websocket, token="t")

        assert {"type": "connected"} in websocket.messages()
        run_channel.assert_awaited_once()
        assert run_channel.await_args is not None
        assert run_channel.await_args.args[1] == f"user_notifications:{user.id}"
