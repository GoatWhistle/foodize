import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.service.moderation import moderate_restaurant, moderate_vendor
from shared.exceptions import NotFoundException


def _make_mock_user(user_id: uuid.UUID | None = None) -> MagicMock:
    u = MagicMock()
    u.id = user_id or uuid.uuid4()
    u.name = "Test User"
    u.phone_number = "79001234567"
    u.permissions = ["customers:read"]
    return u


def _make_mock_vendor(vendor_id: uuid.UUID | None = None) -> MagicMock:
    v = MagicMock()
    v.id = vendor_id or uuid.uuid4()
    v.approval_status = "PENDING"
    v.rejection_reason = None
    v.user_id = uuid.uuid4()
    v.user = _make_mock_user()
    v.user.id = v.user_id
    v.restaurants = []
    v.created_at = datetime(2026, 1, 1)
    return v


def _make_mock_restaurant(rest_id: uuid.UUID | None = None) -> MagicMock:
    r = MagicMock()
    r.id = rest_id or uuid.uuid4()
    r.name = "Test Restaurant"
    r.moderation_status = "PENDING"
    return r


class TestModerateVendor:
    @pytest.mark.asyncio
    async def test_success_logs_audit(self) -> None:
        vendor = _make_mock_vendor()
        updated_vendor = _make_mock_vendor(vendor.id)
        session = AsyncMock()
        actor_id = uuid.uuid4()

        with (
            patch(
                "features.admin.crud.get_vendor_by_id",
                new_callable=AsyncMock,
                return_value=vendor,
            ),
            patch(
                "features.admin.crud.set_vendor_moderation",
                new_callable=AsyncMock,
                return_value=updated_vendor,
            ),
            patch(
                "features.admin.audit_log.service.log_action", new_callable=AsyncMock
            ) as mock_log,
        ):
            await moderate_vendor(session, vendor.id, "APPROVED", actor_id=actor_id)
            mock_log.assert_awaited_once()
            assert mock_log.call_args[1]["action"] == "MODERATE_VENDOR"

    @pytest.mark.asyncio
    async def test_not_found(self) -> None:
        with patch(
            "features.admin.crud.get_vendor_by_id", new_callable=AsyncMock, return_value=None
        ):
            with pytest.raises(NotFoundException):
                await moderate_vendor(MagicMock(), uuid.uuid4(), "APPROVED")


class TestModerateRestaurant:
    @pytest.mark.asyncio
    async def test_success_logs_audit(self) -> None:
        restaurant = _make_mock_restaurant()
        updated_restaurant = _make_mock_restaurant(restaurant.id)
        session = AsyncMock()
        actor_id = uuid.uuid4()
        session.get = AsyncMock(return_value=restaurant)

        with (
            patch(
                "features.admin.crud.set_restaurant_moderation",
                new_callable=AsyncMock,
                return_value=updated_restaurant,
            ),
            patch(
                "features.admin.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=updated_restaurant,
            ),
            patch(
                "features.admin.audit_log.service.log_action", new_callable=AsyncMock
            ) as mock_log,
        ):
            await moderate_restaurant(session, restaurant.id, "APPROVED", actor_id=actor_id)
            mock_log.assert_awaited_once()
            assert mock_log.call_args[1]["action"] == "MODERATE_RESTAURANT"

    @pytest.mark.asyncio
    async def test_not_found(self) -> None:
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        with pytest.raises(NotFoundException):
            await moderate_restaurant(session, uuid.uuid4(), "APPROVED")
