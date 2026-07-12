import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.dependencies import (
    get_order_for_staff_or_vendor,
    verify_restaurant_access,
)
from shared.enums.roles import UserRole
from shared.exceptions import AccessDeniedException, NotFoundException
from shared.permissions import (
    CUSTOMER_PERMISSIONS,
    STAFF_PERMISSIONS,
    VENDOR_PERMISSIONS,
    serialize_permissions,
)


def _make_user(role: str) -> MagicMock:
    user = MagicMock()
    user.id = uuid.uuid4()
    user.user_role = role
    permissions = CUSTOMER_PERMISSIONS
    if role == UserRole.VENDOR.value:
        permissions = VENDOR_PERMISSIONS
    elif role == UserRole.STAFF.value:
        permissions = STAFF_PERMISSIONS
    user.permissions = serialize_permissions(permissions)
    return user


def _make_restaurant(vendor_id: uuid.UUID) -> MagicMock:
    r = MagicMock()
    r.id = uuid.uuid4()
    r.vendor_id = vendor_id
    return r


def _execute_result(value: object | None) -> MagicMock:
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


class TestVerifyRestaurantAccess:
    @pytest.mark.asyncio
    async def test_vendor_correct_ownership(self) -> None:
        vendor_id = uuid.uuid4()
        restaurant = _make_restaurant(vendor_id)
        user = _make_user(UserRole.VENDOR.value)

        vendor_mock = MagicMock()
        vendor_mock.id = vendor_id

        session = AsyncMock()
        session.execute = AsyncMock(return_value=_execute_result(restaurant))

        with patch(
            "features.orders.dependencies.get_vendor_by_user_id",
            new_callable=AsyncMock,
            return_value=vendor_mock,
        ):
            result = await verify_restaurant_access(session, restaurant.id, user)
            assert result == restaurant

    @pytest.mark.asyncio
    async def test_vendor_wrong_ownership(self) -> None:
        restaurant = _make_restaurant(uuid.uuid4())
        user = _make_user(UserRole.VENDOR.value)

        vendor_mock = MagicMock()
        vendor_mock.id = uuid.uuid4()

        session = AsyncMock()
        session.execute = AsyncMock(return_value=_execute_result(restaurant))

        with patch(
            "features.orders.dependencies.get_vendor_by_user_id",
            new_callable=AsyncMock,
            return_value=vendor_mock,
        ):
            with pytest.raises(AccessDeniedException):
                await verify_restaurant_access(session, restaurant.id, user)

    @pytest.mark.asyncio
    async def test_staff_at_correct_restaurant(self) -> None:
        restaurant_id = uuid.uuid4()
        restaurant = _make_restaurant(uuid.uuid4())
        restaurant.id = restaurant_id
        user = _make_user(UserRole.STAFF.value)

        staff_profile = MagicMock()

        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=[_execute_result(restaurant), _execute_result(staff_profile)]
        )

        result = await verify_restaurant_access(session, restaurant_id, user)
        assert result == restaurant

    @pytest.mark.asyncio
    async def test_staff_at_wrong_restaurant(self) -> None:
        restaurant_id = uuid.uuid4()
        restaurant = _make_restaurant(uuid.uuid4())
        restaurant.id = restaurant_id
        user = _make_user(UserRole.STAFF.value)

        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=[_execute_result(restaurant), _execute_result(None)]
        )

        with pytest.raises(AccessDeniedException):
            await verify_restaurant_access(session, restaurant_id, user)

    @pytest.mark.asyncio
    async def test_other_role_denied(self) -> None:
        restaurant = _make_restaurant(uuid.uuid4())
        user = _make_user(UserRole.CUSTOMER.value)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=_execute_result(restaurant))

        with pytest.raises(AccessDeniedException):
            await verify_restaurant_access(session, restaurant.id, user)

    @pytest.mark.asyncio
    async def test_restaurant_not_found(self) -> None:
        user = _make_user(UserRole.VENDOR.value)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=_execute_result(None))

        with pytest.raises(NotFoundException):
            await verify_restaurant_access(session, uuid.uuid4(), user)


class TestGetOrderForStaffOrVendor:
    @pytest.mark.asyncio
    async def test_order_not_found(self) -> None:
        with patch(
            "features.orders.dependencies.get_order_by_id_for_update",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await get_order_for_staff_or_vendor(uuid.uuid4(), AsyncMock(), MagicMock())
