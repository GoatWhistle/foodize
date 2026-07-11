import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.notifications.crud import (
    create_notification,
    delete_all_notifications,
    delete_notification,
    get_unread_count,
    get_user_notifications,
    mark_all_as_read,
    mark_as_read,
)
from features.notifications.models import Notification, NotificationType


def _make_notification(user_id=None, is_read=False):
    n = MagicMock(spec=Notification)
    n.id = uuid.uuid4()
    n.user_id = user_id or uuid.uuid4()
    n.title = "Test"
    n.message = "Body"
    n.type = NotificationType.SYSTEM
    n.is_read = is_read
    return n


class TestCreateNotification:
    @pytest.mark.asyncio
    async def test_creates_and_returns(self):
        session = AsyncMock()
        session.add = MagicMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()

        uid = uuid.uuid4()
        await create_notification(session, uid, "Hello", "World", NotificationType.ORDER_STATUS)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()
        session.refresh.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_default_type_is_system(self):
        session = AsyncMock()
        session.add = MagicMock()
        added = []
        session.add.side_effect = lambda obj: added.append(obj)

        await create_notification(session, uuid.uuid4(), "T", "M")

        assert added[0].type == NotificationType.SYSTEM


class TestGetUserNotifications:
    @pytest.mark.asyncio
    async def test_returns_list_and_total(self):
        session = AsyncMock()
        uid = uuid.uuid4()

        notifications = [_make_notification(uid) for _ in range(3)]

        scalars_mock = MagicMock()
        scalars_mock.all.return_value = notifications

        first_result = MagicMock()
        first_result.scalars.return_value = scalars_mock

        scalar_result = MagicMock()
        scalar_result.scalar_one.return_value = 3

        session.execute = AsyncMock(side_effect=[first_result, scalar_result])

        items, total = await get_user_notifications(session, uid, limit=10, offset=0)

        assert total == 3
        assert len(items) == 3


class TestGetUnreadCount:
    @pytest.mark.asyncio
    async def test_returns_count(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one.return_value = 5
        session.execute = AsyncMock(return_value=result_mock)

        count = await get_unread_count(session, uuid.uuid4())

        assert count == 5


class TestMarkAsRead:
    @pytest.mark.asyncio
    async def test_marks_unread_notification(self):
        session = AsyncMock()
        uid = uuid.uuid4()
        n = _make_notification(uid, is_read=False)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = n
        session.execute = AsyncMock(return_value=result_mock)

        returned = await mark_as_read(session, n.id, uid)

        assert n.is_read is True
        session.flush.assert_awaited_once()
        assert returned is n

    @pytest.mark.asyncio
    async def test_skips_already_read(self):
        session = AsyncMock()
        n = _make_notification(is_read=True)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = n
        session.execute = AsyncMock(return_value=result_mock)

        await mark_as_read(session, n.id, uuid.uuid4())

        session.flush.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result_mock)

        result = await mark_as_read(session, uuid.uuid4(), uuid.uuid4())

        assert result is None


class TestMarkAllAsRead:
    @pytest.mark.asyncio
    async def test_commits(self):
        session = AsyncMock()

        await mark_all_as_read(session, uuid.uuid4())

        session.execute.assert_awaited_once()
        session.flush.assert_awaited_once()


class TestDeleteNotification:
    @pytest.mark.asyncio
    async def test_returns_true_when_deleted(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.rowcount = 1
        session.execute = AsyncMock(return_value=result_mock)

        deleted = await delete_notification(session, uuid.uuid4(), uuid.uuid4())

        assert deleted is True

    @pytest.mark.asyncio
    async def test_returns_false_when_not_found(self):
        session = AsyncMock()
        result_mock = MagicMock()
        result_mock.rowcount = 0
        session.execute = AsyncMock(return_value=result_mock)

        deleted = await delete_notification(session, uuid.uuid4(), uuid.uuid4())

        assert deleted is False


class TestDeleteAllNotifications:
    @pytest.mark.asyncio
    async def test_commits(self):
        session = AsyncMock()

        await delete_all_notifications(session, uuid.uuid4())

        session.execute.assert_awaited_once()
        session.flush.assert_awaited_once()
