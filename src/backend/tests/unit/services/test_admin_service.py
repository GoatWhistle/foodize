import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.service import (
    activate_user_service,
    deactivate_user_service,
    get_orders_list,
    get_stats,
    get_user_or_404,
    get_users_list,
    set_user_role,
)
from shared.enums.roles import UserRole
from shared.exceptions import NotFoundException


class TestGetUserOr404:
    @pytest.mark.asyncio
    async def test_found(self):
        user = MagicMock()
        with patch(
            "features.admin.crud.get_user_by_id",
            new_callable=AsyncMock,
            return_value=user,
        ):
            result = await get_user_or_404(AsyncMock(), uuid.uuid4())
            assert result == user

    @pytest.mark.asyncio
    async def test_not_found(self):
        with patch(
            "features.admin.crud.get_user_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await get_user_or_404(AsyncMock(), uuid.uuid4())


class TestGetUsersList:
    @pytest.mark.asyncio
    async def test_success(self):
        users = [MagicMock()]
        with (
            patch(
                "features.admin.crud.get_all_users",
                new_callable=AsyncMock,
                return_value=users,
            ),
            patch(
                "features.admin.crud.count_all_users",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            data, total = await get_users_list(AsyncMock(), None, 0, 20)
            assert len(data) == 1
            assert total == 1


class TestDeactivateActivate:
    @pytest.mark.asyncio
    async def test_deactivate_success(self):
        user = MagicMock()
        deactivated = MagicMock()
        with (
            patch(
                "features.admin.crud.get_user_by_id",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.admin.crud.deactivate_user",
                new_callable=AsyncMock,
                return_value=deactivated,
            ),
        ):
            result = await deactivate_user_service(AsyncMock(), uuid.uuid4())
            assert result == deactivated

    @pytest.mark.asyncio
    async def test_activate_success(self):
        user = MagicMock()
        activated = MagicMock()
        with (
            patch(
                "features.admin.crud.get_user_by_id",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.admin.crud.activate_user",
                new_callable=AsyncMock,
                return_value=activated,
            ),
        ):
            result = await activate_user_service(AsyncMock(), uuid.uuid4())
            assert result == activated


class TestSetUserRole:
    @pytest.mark.asyncio
    async def test_sets_role(self):
        user = MagicMock()
        user.user_role = UserRole.CUSTOMER.value

        session = AsyncMock()
        session.commit = AsyncMock()
        session.refresh = AsyncMock()

        with patch(
            "features.admin.crud.get_user_by_id",
            new_callable=AsyncMock,
            return_value=user,
        ):
            await set_user_role(session, uuid.uuid4(), UserRole.VENDOR)
            assert user.user_role == UserRole.VENDOR.value
            session.commit.assert_awaited_once()


class TestGetOrdersList:
    @pytest.mark.asyncio
    async def test_success(self):
        with (
            patch(
                "features.admin.crud.get_all_orders",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.admin.crud.count_all_orders",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            data, total = await get_orders_list(AsyncMock())
            assert data == []
            assert total == 0


class TestGetStats:
    @pytest.mark.asyncio
    async def test_success(self):
        stats = {"users": 10, "orders": 5}
        with patch(
            "features.admin.crud.get_platform_stats",
            new_callable=AsyncMock,
            return_value=stats,
        ):
            result = await get_stats(AsyncMock())
            assert result == stats
