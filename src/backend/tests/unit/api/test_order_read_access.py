import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.api.order import verify_order_read_access
from shared.enums.permissions import Permission
from shared.exceptions import AccessDeniedException
from shared.permissions import (
    ADMIN_PERMISSIONS,
    CUSTOMER_PERMISSIONS,
    STAFF_PERMISSIONS,
    VENDOR_PERMISSIONS,
    serialize_permissions,
)


def _make_user(permissions: frozenset[Permission], user_id: uuid.UUID | None = None) -> MagicMock:
    user = MagicMock()
    user.id = user_id or uuid.uuid4()
    user.permissions = serialize_permissions(permissions)
    return user


def _make_order(user_id: uuid.UUID, restaurant_id: uuid.UUID | None = None) -> MagicMock:
    order = MagicMock()
    order.id = uuid.uuid4()
    order.user_id = user_id
    order.restaurant_id = restaurant_id or uuid.uuid4()
    return order


class TestVerifyOrderReadAccess:
    async def test_owner_allowed(self) -> None:
        user = _make_user(CUSTOMER_PERMISSIONS)
        order = _make_order(user_id=user.id)
        session = AsyncMock()

        await verify_order_read_access(session, order, user)

    async def test_other_customer_denied(self) -> None:
        user = _make_user(CUSTOMER_PERMISSIONS)
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        with pytest.raises(AccessDeniedException):
            await verify_order_read_access(session, order, user)

    async def test_admin_allowed(self) -> None:
        user = _make_user(ADMIN_PERMISSIONS)
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        await verify_order_read_access(session, order, user)

    async def test_vendor_of_own_restaurant_allowed(self) -> None:
        user = _make_user(VENDOR_PERMISSIONS)
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        with patch(
            "features.orders.api.order.verify_restaurant_access",
            new_callable=AsyncMock,
        ) as mock_verify:
            await verify_order_read_access(session, order, user)

        mock_verify.assert_awaited_once_with(session, order.restaurant_id, user)

    async def test_vendor_of_other_restaurant_denied(self) -> None:
        user = _make_user(VENDOR_PERMISSIONS)
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        with (
            patch(
                "features.orders.api.order.verify_restaurant_access",
                new_callable=AsyncMock,
                side_effect=AccessDeniedException(),
            ),
            pytest.raises(AccessDeniedException),
        ):
            await verify_order_read_access(session, order, user)

    async def test_staff_with_restaurant_permission_allowed(self) -> None:
        user = _make_user(STAFF_PERMISSIONS)
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        with patch(
            "features.orders.api.order.verify_restaurant_access",
            new_callable=AsyncMock,
        ) as mock_verify:
            await verify_order_read_access(session, order, user)

        mock_verify.assert_awaited_once_with(session, order.restaurant_id, user)

    async def test_staff_at_wrong_restaurant_denied(self) -> None:
        user = _make_user(STAFF_PERMISSIONS)
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        with (
            patch(
                "features.orders.api.order.verify_restaurant_access",
                new_callable=AsyncMock,
                side_effect=AccessDeniedException(),
            ),
            pytest.raises(AccessDeniedException),
        ):
            await verify_order_read_access(session, order, user)

    async def test_no_permissions_denied(self) -> None:
        user = _make_user(frozenset(), user_id=uuid.uuid4())
        order = _make_order(user_id=uuid.uuid4())
        session = AsyncMock()

        with pytest.raises(AccessDeniedException):
            await verify_order_read_access(session, order, user)
