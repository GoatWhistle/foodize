import uuid
from datetime import UTC, datetime
from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from features.notifications.models import NotificationType
from features.users.models import User


class _FakeNotification:
    def __init__(self, user_id: uuid.UUID | None = None, is_read: bool = False) -> None:
        self.id = uuid.uuid4()
        self.user_id = user_id or uuid.uuid4()
        self.title = "Заказ принят"
        self.message = "Ресторан принял ваш заказ"
        self.type = NotificationType.ORDER_STATUS
        self.is_read = is_read
        self.created_at = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)


def _make_mock_notification(
    user_id: uuid.UUID | None = None, is_read: bool = False
) -> _FakeNotification:
    return _FakeNotification(user_id=user_id, is_read=is_read)


class TestNotificationsAPIAccess:
    async def test_requires_auth(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/notifications")
        assert response.status_code == HTTPStatus.UNAUTHORIZED


class TestGetNotifications:
    @pytest.mark.usefixtures("as_user")
    async def test_returns_empty_list(self, client: AsyncClient) -> None:
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

        assert response.status_code == HTTPStatus.OK
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["unread_count"] == 0

    async def test_returns_notifications_with_unread_count(
        self, client: AsyncClient, as_user: User
    ) -> None:
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

        assert response.status_code == HTTPStatus.OK
        data = response.json()
        assert data["total"] == 1
        assert data["unread_count"] == 1
        assert len(data["items"]) == 1

    @pytest.mark.usefixtures("as_user")
    async def test_pagination_params(self, client: AsyncClient) -> None:
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
    async def test_marks_notification_read(self, client: AsyncClient, as_user: User) -> None:
        n = _make_mock_notification(user_id=as_user.id)
        n.is_read = True

        with patch(
            "features.notifications.api.crud.mark_as_read",
            new_callable=AsyncMock,
            return_value=n,
        ):
            response = await client.post(f"/api/v1/notifications/{n.id}/read")

        assert response.status_code == HTTPStatus.OK

    @pytest.mark.usefixtures("as_user")
    async def test_returns_404_when_not_found(self, client: AsyncClient) -> None:
        with patch(
            "features.notifications.api.crud.mark_as_read",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.post(f"/api/v1/notifications/{uuid.uuid4()}/read")

        assert response.status_code == HTTPStatus.NOT_FOUND


class TestMarkAllAsRead:
    @pytest.mark.usefixtures("as_user")
    async def test_marks_all_read(self, client: AsyncClient) -> None:
        with patch(
            "features.notifications.api.crud.mark_all_as_read",
            new_callable=AsyncMock,
        ) as mock_mark:
            response = await client.post("/api/v1/notifications/read-all")

        assert response.status_code == HTTPStatus.NO_CONTENT
        mock_mark.assert_awaited_once()


class TestDeleteNotification:
    @pytest.mark.usefixtures("as_user")
    async def test_deletes_notification(self, client: AsyncClient) -> None:
        with patch(
            "features.notifications.api.crud.delete_notification",
            new_callable=AsyncMock,
            return_value=True,
        ):
            response = await client.delete(f"/api/v1/notifications/{uuid.uuid4()}")

        assert response.status_code == HTTPStatus.NO_CONTENT

    @pytest.mark.usefixtures("as_user")
    async def test_returns_404_when_not_found(self, client: AsyncClient) -> None:
        with patch(
            "features.notifications.api.crud.delete_notification",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.delete(f"/api/v1/notifications/{uuid.uuid4()}")

        assert response.status_code == HTTPStatus.NOT_FOUND


class TestDeleteAllNotifications:
    @pytest.mark.usefixtures("as_user")
    async def test_deletes_all(self, client: AsyncClient) -> None:
        with patch(
            "features.notifications.api.crud.delete_all_notifications",
            new_callable=AsyncMock,
        ) as mock_del:
            response = await client.delete("/api/v1/notifications")

        assert response.status_code == HTTPStatus.NO_CONTENT
        mock_del.assert_awaited_once()


class _FakeDevice:
    def __init__(self, user_id: uuid.UUID, token: str, platform: str) -> None:
        self.id = uuid.uuid4()
        self.user_id = user_id
        self.token = token
        self.platform = platform
        self.language = "en"
        self.is_active = True
        self.created_at = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)


class TestRegisterDevice:
    async def test_requires_auth(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/notifications/devices",
            json={"token": "tok", "platform": "ios"},
        )
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    async def test_registers_device(self, client: AsyncClient, as_user: User) -> None:
        device = _FakeDevice(as_user.id, "tok-abc", "ios")
        with patch(
            "features.notifications.api.push_crud.upsert_device",
            new_callable=AsyncMock,
            return_value=device,
        ) as mock_upsert:
            response = await client.post(
                "/api/v1/notifications/devices",
                json={"token": "tok-abc", "platform": "ios", "language": "en"},
            )

        assert response.status_code == HTTPStatus.CREATED
        data = response.json()
        assert data["token"] == "tok-abc"
        assert data["platform"] == "ios"
        mock_upsert.assert_awaited_once()

    @pytest.mark.usefixtures("as_user")
    async def test_rejects_invalid_platform(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/notifications/devices",
            json={"token": "tok", "platform": "windows_phone"},
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST

    @pytest.mark.usefixtures("as_user")
    async def test_rejects_empty_token(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/notifications/devices",
            json={"token": "", "platform": "ios"},
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST


class TestUnregisterDevice:
    async def test_requires_auth(self, client: AsyncClient) -> None:
        response = await client.delete("/api/v1/notifications/devices/tok")
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    @pytest.mark.usefixtures("as_user")
    async def test_deactivates_device(self, client: AsyncClient) -> None:
        with patch(
            "features.notifications.api.push_crud.deactivate_device",
            new_callable=AsyncMock,
            return_value=True,
        ) as mock_deactivate:
            response = await client.delete("/api/v1/notifications/devices/tok-xyz")

        assert response.status_code == HTTPStatus.NO_CONTENT
        mock_deactivate.assert_awaited_once()
