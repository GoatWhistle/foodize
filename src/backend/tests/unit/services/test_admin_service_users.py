import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.exceptions import PermissionAssignmentDeniedException
from features.admin.service.users import (
    activate_user_service,
    deactivate_user_service,
    get_user_or_404,
    get_users_list,
    set_user_permissions,
)
from shared.enums.permissions import Permission
from shared.exceptions import NotFoundException


def _make_mock_user(user_id: uuid.UUID | None = None) -> MagicMock:
    u = MagicMock()
    u.id = user_id or uuid.uuid4()
    u.name = "Test User"
    u.phone_number = "79001234567"
    u.permissions = ["customers:read"]
    return u


class TestGetUserOrNotFound:
    @pytest.mark.asyncio
    async def test_found(self) -> None:
        user = _make_mock_user()
        with patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=user):
            result = await get_user_or_404(MagicMock(), user.id)
            assert result is user

    @pytest.mark.asyncio
    async def test_not_found(self) -> None:
        with patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=None):
            with pytest.raises(NotFoundException):
                await get_user_or_404(MagicMock(), uuid.uuid4())


class TestDeactivateActivateUser:
    @pytest.mark.asyncio
    async def test_deactivate_success(self) -> None:
        user = _make_mock_user()
        deactivated = _make_mock_user(user.id)
        with (
            patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=user),
            patch(
                "features.admin.crud.deactivate_user",
                new_callable=AsyncMock,
                return_value=deactivated,
            ),
        ):
            result = await deactivate_user_service(MagicMock(), user.id)
            assert result is deactivated

    @pytest.mark.asyncio
    async def test_deactivate_not_found(self) -> None:
        with patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=None):
            with pytest.raises(NotFoundException):
                await deactivate_user_service(MagicMock(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_activate_success(self) -> None:
        user = _make_mock_user()
        activated = _make_mock_user(user.id)
        with (
            patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=user),
            patch(
                "features.admin.crud.activate_user",
                new_callable=AsyncMock,
                return_value=activated,
            ),
        ):
            result = await activate_user_service(MagicMock(), user.id)
            assert result is activated

    @pytest.mark.asyncio
    async def test_activate_not_found(self) -> None:
        with patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=None):
            with pytest.raises(NotFoundException):
                await activate_user_service(MagicMock(), uuid.uuid4())


class TestSetUserPermissions:
    @pytest.mark.asyncio
    async def test_logs_audit_action(self) -> None:
        user = _make_mock_user()
        actor = _make_mock_user()
        actor.permissions = [
            Permission.USERS_ASSIGN_PERMISSIONS.value,
            Permission.USERS_READ.value,
        ]
        session = AsyncMock()

        with (
            patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=user),
            patch(
                "features.admin.audit_log.service.log_action", new_callable=AsyncMock
            ) as mock_log,
        ):
            await set_user_permissions(session, user.id, [Permission.USERS_READ.value], actor=actor)
            mock_log.assert_awaited_once()
            call_kwargs = mock_log.call_args[1]
            assert call_kwargs["action"] == "UPDATE_PERMISSIONS"
            assert call_kwargs["entity_type"] == "user"
            assert call_kwargs["actor_id"] == actor.id

    @pytest.mark.asyncio
    async def test_rejects_escalation_beyond_actor(self) -> None:
        user = _make_mock_user()
        actor = _make_mock_user()
        actor.permissions = [Permission.USERS_ASSIGN_PERMISSIONS.value]
        session = AsyncMock()

        with pytest.raises(PermissionAssignmentDeniedException):
            await set_user_permissions(
                session, user.id, [Permission.ADMIN_ACCESS.value], actor=actor
            )

    @pytest.mark.asyncio
    async def test_rejects_actor_without_assign_permission(self) -> None:
        user = _make_mock_user()
        actor = _make_mock_user()
        actor.permissions = [Permission.ADMIN_ACCESS.value]
        session = AsyncMock()

        with pytest.raises(PermissionAssignmentDeniedException):
            await set_user_permissions(session, user.id, [Permission.USERS_READ.value], actor=actor)

    @pytest.mark.asyncio
    async def test_rejects_self_change(self) -> None:
        actor = _make_mock_user()
        actor.permissions = [
            Permission.USERS_ASSIGN_PERMISSIONS.value,
            Permission.USERS_READ.value,
        ]
        session = AsyncMock()

        with pytest.raises(PermissionAssignmentDeniedException):
            await set_user_permissions(
                session, actor.id, [Permission.USERS_READ.value], actor=actor
            )


class TestGetUsersList:
    @pytest.mark.asyncio
    async def test_returns_users_and_total(self) -> None:
        users = [_make_mock_user(), _make_mock_user()]
        with (
            patch(
                "features.admin.crud.get_all_users",
                new_callable=AsyncMock,
                return_value=users,
            ),
            patch(
                "features.admin.crud.count_all_users",
                new_callable=AsyncMock,
                return_value=2,
            ),
        ):
            result, total = await get_users_list(MagicMock(), None, 0, 20)
            assert len(result) == 2
            assert total == 2

    @pytest.mark.asyncio
    async def test_empty(self) -> None:
        with (
            patch("features.admin.crud.get_all_users", new_callable=AsyncMock, return_value=[]),
            patch("features.admin.crud.count_all_users", new_callable=AsyncMock, return_value=0),
        ):
            result, total = await get_users_list(MagicMock(), None, 0, 20)
            assert result == []
            assert total == 0
