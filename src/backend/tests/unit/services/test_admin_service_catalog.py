import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.service.catalog import (
    delete_restaurant_service,
    delete_review_service,
    delete_vendor_service,
    get_orders_list,
    get_restaurant_or_404,
    get_restaurants_list,
    get_reviews_list,
    get_vendor_or_404,
    get_vendors_list,
)
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
    v.created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return v


def _make_mock_review(review_id: uuid.UUID | None = None) -> MagicMock:
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
    rv.created_at = datetime(2026, 1, 1, tzinfo=UTC)
    return rv


class TestGetOrdersList:
    async def test_success(self) -> None:
        orders = [MagicMock(), MagicMock()]
        with (
            patch(
                "features.admin.crud.get_all_orders", new_callable=AsyncMock, return_value=orders
            ),
            patch("features.admin.crud.count_all_orders", new_callable=AsyncMock, return_value=2),
        ):
            result, total = await get_orders_list(MagicMock())
            assert len(result) == 2
            assert total == 2


class TestGetRestaurantsList:
    async def test_success(self) -> None:
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

    async def test_restaurant_not_found(self) -> None:
        with (
            patch(
                "features.admin.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            pytest.raises(NotFoundException),
        ):
            await get_restaurant_or_404(MagicMock(), uuid.uuid4())


class TestDeleteRestaurantService:
    async def test_success(self) -> None:
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

    async def test_not_found(self) -> None:
        with (
            patch(
                "features.admin.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            pytest.raises(NotFoundException),
        ):
            await delete_restaurant_service(MagicMock(), uuid.uuid4())


class TestGetVendorsList:
    async def test_success(self) -> None:
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
            _result, total = await get_vendors_list(MagicMock())
            assert total == 1

    async def test_vendor_not_found(self) -> None:
        with (
            patch(
                "features.admin.crud.get_vendor_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            pytest.raises(NotFoundException),
        ):
            await get_vendor_or_404(MagicMock(), uuid.uuid4())


class TestDeleteVendorService:
    async def test_success(self) -> None:
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

    async def test_not_found(self) -> None:
        with (
            patch(
                "features.admin.crud.get_vendor_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            pytest.raises(NotFoundException),
        ):
            await delete_vendor_service(MagicMock(), uuid.uuid4())


class TestGetReviewsList:
    async def test_success(self) -> None:
        reviews = [MagicMock(), MagicMock()]
        with (
            patch(
                "features.admin.crud.get_all_reviews",
                new_callable=AsyncMock,
                return_value=reviews,
            ),
            patch("features.admin.crud.count_all_reviews", new_callable=AsyncMock, return_value=2),
        ):
            result, total = await get_reviews_list(MagicMock())
            assert len(result) == 2
            assert total == 2


class TestDeleteReviewService:
    async def test_success(self) -> None:
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

    async def test_not_found(self) -> None:
        with (
            patch(
                "features.admin.crud.get_review_by_id", new_callable=AsyncMock, return_value=None
            ),
            pytest.raises(NotFoundException),
        ):
            await delete_review_service(MagicMock(), uuid.uuid4())
