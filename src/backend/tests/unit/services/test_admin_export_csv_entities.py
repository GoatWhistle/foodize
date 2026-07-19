import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from features.admin.export import (
    export_restaurants_csv,
    export_reviews_csv,
    export_vendors_csv,
)


def _make_restaurant(rid: uuid.UUID | None = None) -> MagicMock:
    r = MagicMock()
    r.id = rid or uuid.uuid4()
    r.name = "Тест Кафе"
    r.address = "ул. Ленина, 1"
    r.vendor_name = "Вендор"
    r.vendor_phone = "79001111111"
    r.moderation_status = "APPROVED"
    r.average_rating = 4.5
    r.review_count = 10
    r.orders_count = 200
    r.created_at = datetime(2026, 1, 1, 0, 0)
    return r


def _make_vendor(vid: uuid.UUID | None = None) -> MagicMock:
    v = MagicMock()
    v.id = vid or uuid.uuid4()
    v.approval_status = "APPROVED"
    v.restaurants = [MagicMock(), MagicMock()]
    v.created_at = datetime(2026, 1, 5, 9, 0)
    v.user = MagicMock()
    v.user.name = "Вендор Иван"
    v.user.phone_number = "79002222222"
    return v


def _make_review(rvid: uuid.UUID | None = None) -> MagicMock:
    rv = MagicMock()
    rv.id = rvid or uuid.uuid4()
    rv.restaurant_name = "Тест Кафе"
    rv.user_name = "Иван"
    rv.rating = 5
    rv.text = "Отлично!"
    rv.is_verified_purchase = True
    rv.created_at = datetime(2026, 1, 20, 14, 0)
    return rv


class TestExportRestaurantsCsv:
    async def test_returns_csv_with_data(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_restaurants", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [_make_restaurant()]
            result = await export_restaurants_csv(session)
        content = result.decode("utf-8-sig")
        assert "Тест Кафе" in content
        assert "ул. Ленина, 1" in content

    async def test_includes_rating_and_counts(self) -> None:
        session = AsyncMock()
        resto = _make_restaurant()
        resto.average_rating = 4.8
        resto.review_count = 25
        resto.orders_count = 500
        with patch(
            "features.admin.export.csv_exports.crud.get_all_restaurants", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [resto]
            result = await export_restaurants_csv(session)
        content = result.decode("utf-8-sig")
        assert "4.8" in content


class TestExportVendorsCsv:
    async def test_returns_csv_with_vendor_data(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_vendors", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [_make_vendor()]
            result = await export_vendors_csv(session)
        content = result.decode("utf-8-sig")
        assert "Вендор Иван" in content
        assert "APPROVED" in content

    async def test_restaurant_count_in_row(self) -> None:
        session = AsyncMock()
        v = _make_vendor()
        v.restaurants = [MagicMock(), MagicMock(), MagicMock()]
        with patch(
            "features.admin.export.csv_exports.crud.get_all_vendors", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [v]
            result = await export_vendors_csv(session)
        content = result.decode("utf-8-sig")
        assert "3" in content


class TestExportReviewsCsv:
    async def test_returns_csv_with_review_data(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_reviews", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [_make_review()]
            result = await export_reviews_csv(session)
        content = result.decode("utf-8-sig")
        assert "Тест Кафе" in content
        assert "Отлично!" in content

    async def test_min_rating_filter(self) -> None:
        session = AsyncMock()
        reviews = [_make_review(), _make_review()]
        reviews[0].rating = 2
        reviews[1].rating = 5
        with patch(
            "features.admin.export.csv_exports.crud.get_all_reviews", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = reviews
            result = await export_reviews_csv(session, min_rating=4)
        content = result.decode("utf-8-sig")
        lines = [line for line in content.split("\n") if line.strip()]
        assert len(lines) == 2

    async def test_max_rating_filter(self) -> None:
        session = AsyncMock()
        reviews = [_make_review(), _make_review()]
        reviews[0].rating = 3
        reviews[1].rating = 5
        with patch(
            "features.admin.export.csv_exports.crud.get_all_reviews", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = reviews
            result = await export_reviews_csv(session, max_rating=4)
        content = result.decode("utf-8-sig")
        lines = [line for line in content.split("\n") if line.strip()]
        assert len(lines) == 2

    async def test_verified_purchase_yes(self) -> None:
        session = AsyncMock()
        rv = _make_review()
        rv.is_verified_purchase = True
        with patch(
            "features.admin.export.csv_exports.crud.get_all_reviews", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [rv]
            result = await export_reviews_csv(session)
        content = result.decode("utf-8-sig")
        assert "Да" in content
