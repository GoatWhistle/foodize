import uuid
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.exceptions import PermissionAssignmentDeniedException
from features.admin.service import (
    activate_user_service,
    deactivate_user_service,
    delete_restaurant_service,
    delete_review_service,
    delete_vendor_service,
    get_advanced_analytics,
    get_finance,
    get_orders_list,
    get_restaurant_or_404,
    get_restaurants_list,
    get_reviews_list,
    get_stats,
    get_user_or_404,
    get_users_list,
    get_vendor_or_404,
    get_vendors_list,
    moderate_restaurant,
    moderate_vendor,
    set_user_permissions,
)
from shared.enums.permissions import Permission
from shared.exceptions import NotFoundException


def _make_mock_user(user_id: uuid.UUID | None = None):
    u = MagicMock()
    u.id = user_id or uuid.uuid4()
    u.name = "Test User"
    u.phone_number = "79001234567"
    u.permissions = ["customers:read"]
    return u


def _make_mock_vendor(vendor_id: uuid.UUID | None = None):
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


def _make_mock_restaurant(rest_id: uuid.UUID | None = None):
    r = MagicMock()
    r.id = rest_id or uuid.uuid4()
    r.name = "Test Restaurant"
    r.moderation_status = "PENDING"
    return r


def _make_mock_review(review_id: uuid.UUID | None = None):
    rv = MagicMock()
    rv.id = review_id or uuid.uuid4()
    rv.rating = 4
    rv.text = "Good"
    rv.restaurant_name = "Rest"
    rv.restaurant_id = uuid.uuid4()
    rv.user_name = "User"
    rv.user_id = uuid.uuid4()
    rv.user_phone = "79001234567"
    rv.is_verified_purchase = True
    rv.created_at = datetime(2026, 1, 1)
    return rv


class TestGetUserOrNotFound:
    @pytest.mark.asyncio
    async def test_found(self):
        user = _make_mock_user()
        with patch("features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=user):
            result = await get_user_or_404(MagicMock(), user.id)
            assert result is user

    @pytest.mark.asyncio
    async def test_not_found(self):
        with patch(
            "features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=None
        ):
            with pytest.raises(NotFoundException):
                await get_user_or_404(MagicMock(), uuid.uuid4())


class TestDeactivateActivateUser:
    @pytest.mark.asyncio
    async def test_deactivate_success(self):
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
    async def test_deactivate_not_found(self):
        with patch(
            "features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=None
        ):
            with pytest.raises(NotFoundException):
                await deactivate_user_service(MagicMock(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_activate_success(self):
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
    async def test_activate_not_found(self):
        with patch(
            "features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=None
        ):
            with pytest.raises(NotFoundException):
                await activate_user_service(MagicMock(), uuid.uuid4())


class TestSetUserPermissions:
    @pytest.mark.asyncio
    async def test_logs_audit_action(self):
        user = _make_mock_user()
        actor = _make_mock_user()
        actor.permissions = [
            Permission.USERS_ASSIGN_PERMISSIONS.value,
            Permission.USERS_READ.value,
        ]
        session = AsyncMock()

        with (
            patch(
                "features.admin.crud.get_user_by_id", new_callable=AsyncMock, return_value=user
            ),
            patch(
                "features.admin.audit_log.service.log_action", new_callable=AsyncMock
            ) as mock_log,
        ):
            await set_user_permissions(
                session, user.id, [Permission.USERS_READ.value], actor=actor
            )
            mock_log.assert_awaited_once()
            call_kwargs = mock_log.call_args[1]
            assert call_kwargs["action"] == "UPDATE_PERMISSIONS"
            assert call_kwargs["entity_type"] == "user"
            assert call_kwargs["actor_id"] == actor.id

    @pytest.mark.asyncio
    async def test_rejects_escalation_beyond_actor(self):
        user = _make_mock_user()
        actor = _make_mock_user()
        actor.permissions = [Permission.USERS_ASSIGN_PERMISSIONS.value]
        session = AsyncMock()

        with pytest.raises(PermissionAssignmentDeniedException):
            await set_user_permissions(
                session, user.id, [Permission.ADMIN_ACCESS.value], actor=actor
            )

    @pytest.mark.asyncio
    async def test_rejects_actor_without_assign_permission(self):
        user = _make_mock_user()
        actor = _make_mock_user()
        actor.permissions = [Permission.ADMIN_ACCESS.value]
        session = AsyncMock()

        with pytest.raises(PermissionAssignmentDeniedException):
            await set_user_permissions(
                session, user.id, [Permission.USERS_READ.value], actor=actor
            )

    @pytest.mark.asyncio
    async def test_rejects_self_change(self):
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
    async def test_returns_users_and_total(self):
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
    async def test_empty(self):
        with (
            patch("features.admin.crud.get_all_users", new_callable=AsyncMock, return_value=[]),
            patch("features.admin.crud.count_all_users", new_callable=AsyncMock, return_value=0),
        ):
            result, total = await get_users_list(MagicMock(), None, 0, 20)
            assert result == []
            assert total == 0


class TestGetOrdersList:
    @pytest.mark.asyncio
    async def test_success(self):
        orders = [MagicMock(), MagicMock()]
        with (
            patch(
                "features.admin.crud.get_all_orders", new_callable=AsyncMock, return_value=orders
            ),
            patch(
                "features.admin.crud.count_all_orders", new_callable=AsyncMock, return_value=2
            ),
        ):
            result, total = await get_orders_list(MagicMock())
            assert len(result) == 2
            assert total == 2


class TestGetRestaurantsList:
    @pytest.mark.asyncio
    async def test_success(self):
        rests = [MagicMock(), MagicMock()]
        with (
            patch(
                "features.admin.crud.get_all_restaurants",
                new_callable=AsyncMock,
                return_value=rests,
            ),
            patch(
                "features.admin.crud.count_all_restaurants",
                new_callable=AsyncMock,
                return_value=2,
            ),
        ):
            result, total = await get_restaurants_list(MagicMock())
            assert len(result) == 2
            assert total == 2

    @pytest.mark.asyncio
    async def test_restaurant_not_found(self):
        with patch(
            "features.admin.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await get_restaurant_or_404(MagicMock(), uuid.uuid4())


class TestDeleteRestaurantService:
    @pytest.mark.asyncio
    async def test_success(self):
        rest = MagicMock()
        rest.id = uuid.uuid4()

        with (
            patch(
                "features.admin.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=rest,
            ),
            patch(
                "features.admin.crud.deactivate_restaurant",
                new_callable=AsyncMock,
            ),
        ):
            result = await delete_restaurant_service(MagicMock(), rest.id)
            assert result is rest

    @pytest.mark.asyncio
    async def test_not_found(self):
        with patch(
            "features.admin.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await delete_restaurant_service(MagicMock(), uuid.uuid4())


class TestGetVendorsList:
    @pytest.mark.asyncio
    async def test_success(self):
        vendor = _make_mock_vendor()
        with (
            patch(
                "features.admin.crud.get_all_vendors",
                new_callable=AsyncMock,
                return_value=[vendor],
            ),
            patch(
                "features.admin.crud.count_all_vendors",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            result, total = await get_vendors_list(MagicMock())
            assert total == 1

    @pytest.mark.asyncio
    async def test_vendor_not_found(self):
        with patch(
            "features.admin.crud.get_vendor_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await get_vendor_or_404(MagicMock(), uuid.uuid4())


class TestDeleteVendorService:
    @pytest.mark.asyncio
    async def test_success(self):
        vendor = _make_mock_vendor()
        with (
            patch(
                "features.admin.crud.get_vendor_by_id",
                new_callable=AsyncMock,
                return_value=vendor,
            ),
            patch(
                "features.admin.crud.deactivate_vendor",
                new_callable=AsyncMock,
            ),
        ):
            result = await delete_vendor_service(MagicMock(), vendor.id)
            assert result is not None

    @pytest.mark.asyncio
    async def test_not_found(self):
        with patch(
            "features.admin.crud.get_vendor_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await delete_vendor_service(MagicMock(), uuid.uuid4())


class TestGetReviewsList:
    @pytest.mark.asyncio
    async def test_success(self):
        reviews = [MagicMock(), MagicMock()]
        with (
            patch(
                "features.admin.crud.get_all_reviews",
                new_callable=AsyncMock,
                return_value=reviews,
            ),
            patch(
                "features.admin.crud.count_all_reviews", new_callable=AsyncMock, return_value=2
            ),
        ):
            result, total = await get_reviews_list(MagicMock())
            assert len(result) == 2
            assert total == 2


class TestDeleteReviewService:
    @pytest.mark.asyncio
    async def test_success(self):
        review = _make_mock_review()
        deleted = _make_mock_review(review.id)

        with (
            patch(
                "features.admin.crud.get_review_by_id",
                new_callable=AsyncMock,
                return_value=review,
            ),
            patch(
                "features.admin.crud.delete_review",
                new_callable=AsyncMock,
                return_value=deleted,
            ),
        ):
            result = await delete_review_service(MagicMock(), review.id)
            assert result is not None

    @pytest.mark.asyncio
    async def test_not_found(self):
        with patch(
            "features.admin.crud.get_review_by_id", new_callable=AsyncMock, return_value=None
        ):
            with pytest.raises(NotFoundException):
                await delete_review_service(MagicMock(), uuid.uuid4())


class TestModerateVendor:
    @pytest.mark.asyncio
    async def test_success_logs_audit(self):
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
    async def test_not_found(self):
        with patch(
            "features.admin.crud.get_vendor_by_id", new_callable=AsyncMock, return_value=None
        ):
            with pytest.raises(NotFoundException):
                await moderate_vendor(MagicMock(), uuid.uuid4(), "APPROVED")


class TestModerateRestaurant:
    @pytest.mark.asyncio
    async def test_success_logs_audit(self):
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
    async def test_not_found(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        with pytest.raises(NotFoundException):
            await moderate_restaurant(session, uuid.uuid4(), "APPROVED")


class TestGetStats:
    @pytest.mark.asyncio
    async def test_delegates_to_crud(self):
        stats = MagicMock()
        with patch(
            "features.admin.crud.get_platform_stats", new_callable=AsyncMock, return_value=stats
        ):
            result = await get_stats(MagicMock())
            assert result is stats


class TestGetFinance:
    @pytest.mark.asyncio
    async def test_delegates_to_crud(self):
        analytics = MagicMock()
        with patch(
            "features.admin.crud.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=analytics,
        ):
            result = await get_finance(MagicMock())
            assert result is analytics


class TestGetAdvancedAnalytics:
    @pytest.mark.asyncio
    async def test_delegates_to_crud(self):
        analytics = MagicMock()
        with patch(
            "features.admin.crud.get_advanced_analytics",
            new_callable=AsyncMock,
            return_value=analytics,
        ):
            result = await get_advanced_analytics(MagicMock())
            assert result is analytics
