import uuid
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from features.notifications.models import NotificationType


class _FakeNotification:
    def __init__(self, user_id=None, is_read=False):
        self.id = uuid.uuid4()
        self.user_id = user_id or uuid.uuid4()
        self.title = "Заказ принят"
        self.message = "Ресторан принял ваш заказ"
        self.type = NotificationType.ORDER_STATUS
        self.is_read = is_read
        self.created_at = datetime(2026, 1, 1, 0, 0, 0)


def _make_mock_notification(user_id=None, is_read=False):
    return _FakeNotification(user_id=user_id, is_read=is_read)


class TestNotificationsAPIAccess:
    @pytest.mark.asyncio
    async def test_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/notifications")
        assert response.status_code == 401


class TestGetNotifications:
    @pytest.mark.asyncio
    async def test_returns_empty_list(self, client: AsyncClient, as_user):
        with (
            patch(
                "features.notifications.api.crud.get_user_notifications",
                new_callable=AsyncMock,
                return_value=([], 0),
            ),
            patch(
                "features.notifications.api.crud.get_unread_count",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            response = await client.get("/api/v1/notifications")

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["unread_count"] == 0

    @pytest.mark.asyncio
    async def test_returns_notifications_with_unread_count(self, client: AsyncClient, as_user):
        n = _make_mock_notification(user_id=as_user.id)

        with (
            patch(
                "features.notifications.api.crud.get_user_notifications",
                new_callable=AsyncMock,
                return_value=([n], 1),
            ),
            patch(
                "features.notifications.api.crud.get_unread_count",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            response = await client.get("/api/v1/notifications")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["unread_count"] == 1
        assert len(data["items"]) == 1

    @pytest.mark.asyncio
    async def test_pagination_params(self, client: AsyncClient, as_user):
        with (
            patch(
                "features.notifications.api.crud.get_user_notifications",
                new_callable=AsyncMock,
                return_value=([], 0),
            ) as mock_get,
            patch(
                "features.notifications.api.crud.get_unread_count",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            await client.get("/api/v1/notifications?page=2&size=5")

        mock_get.assert_awaited_once()
        call_kwargs = mock_get.call_args
        assert call_kwargs[1]["limit"] == 5
        assert call_kwargs[1]["offset"] == 5


class TestMarkAsRead:
    @pytest.mark.asyncio
    async def test_marks_notification_read(self, client: AsyncClient, as_user):
        n = _make_mock_notification(user_id=as_user.id)
        n.is_read = True

        with patch(
            "features.notifications.api.crud.mark_as_read",
            new_callable=AsyncMock,
            return_value=n,
        ):
            response = await client.post(f"/api/v1/notifications/{n.id}/read")

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self, client: AsyncClient, as_user):
        with patch(
            "features.notifications.api.crud.mark_as_read",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.post(f"/api/v1/notifications/{uuid.uuid4()}/read")

        assert response.status_code == 404


class TestMarkAllAsRead:
    @pytest.mark.asyncio
    async def test_marks_all_read(self, client: AsyncClient, as_user):
        with patch(
            "features.notifications.api.crud.mark_all_as_read",
            new_callable=AsyncMock,
        ) as mock_mark:
            response = await client.post("/api/v1/notifications/read-all")

        assert response.status_code == 200
        assert response.json() == {"success": True}
        mock_mark.assert_awaited_once()


class TestDeleteNotification:
    @pytest.mark.asyncio
    async def test_deletes_notification(self, client: AsyncClient, as_user):
        with patch(
            "features.notifications.api.crud.delete_notification",
            new_callable=AsyncMock,
            return_value=True,
        ):
            response = await client.delete(f"/api/v1/notifications/{uuid.uuid4()}")

        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self, client: AsyncClient, as_user):
        with patch(
            "features.notifications.api.crud.delete_notification",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.delete(f"/api/v1/notifications/{uuid.uuid4()}")

        assert response.status_code == 404


class TestDeleteAllNotifications:
    @pytest.mark.asyncio
    async def test_deletes_all(self, client: AsyncClient, as_user):
        with patch(
            "features.notifications.api.crud.delete_all_notifications",
            new_callable=AsyncMock,
        ) as mock_del:
            response = await client.delete("/api/v1/notifications")

        assert response.status_code == 204
        mock_del.assert_awaited_once()
