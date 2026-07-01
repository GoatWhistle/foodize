import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.export import (
    _make_csv,
    export_users_csv,
    export_orders_csv,
    export_restaurants_csv,
    export_vendors_csv,
    export_reviews_csv,
)
from shared.enums.order_status import OrderStatus


def _make_user(uid=None):
    u = MagicMock()
    u.id = uid or uuid.uuid4()
    u.name = "Иван Иванов"
    u.phone_number = "79001234567"
    u.email = "ivan@example.com"
    u.telegram_username = "ivan_tg"
    u.permissions = ["customers:read"]
    u.is_active = True
    u.created_at = datetime(2026, 1, 15, 10, 0)
    return u


def _make_order(oid=None):
    o = MagicMock()
    o.id = oid or uuid.uuid4()
    o.display_id = "A-101"
    o.status = OrderStatus.COMPLETED
    o.total_price = 1500
    o.cancellation_reason = None
    o.created_at = datetime(2026, 1, 15, 12, 0)
    o.user = MagicMock()
    o.user.name = "Клиент"
    o.user.phone_number = "79009876543"
    o.restaurant = MagicMock()
    o.restaurant.name = "Тест Кафе"
    return o


def _make_restaurant(rid=None):
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


def _make_vendor(vid=None):
    v = MagicMock()
    v.id = vid or uuid.uuid4()
    v.approval_status = "APPROVED"
    v.restaurants = [MagicMock(), MagicMock()]
    v.created_at = datetime(2026, 1, 5, 9, 0)
    v.user = MagicMock()
    v.user.name = "Вендор Иван"
    v.user.phone_number = "79002222222"
    return v


def _make_review(rvid=None):
    rv = MagicMock()
    rv.id = rvid or uuid.uuid4()
    rv.restaurant_name = "Тест Кафе"
    rv.user_name = "Иван"
    rv.rating = 5
    rv.text = "Отлично!"
    rv.is_verified_purchase = True
    rv.created_at = datetime(2026, 1, 20, 14, 0)
    return rv


class TestMakeCsv:
    def test_returns_bytes(self):
        result = _make_csv(["A", "B"], [["1", "2"], ["3", "4"]])
        assert isinstance(result, bytes)

    def test_contains_headers(self):
        result = _make_csv(["Имя", "Телефон"], []).decode("utf-8-sig")
        assert "Имя" in result
        assert "Телефон" in result

    def test_contains_rows(self):
        result = _make_csv(["X"], [["val1"], ["val2"]]).decode("utf-8-sig")
        assert "val1" in result
        assert "val2" in result

    def test_empty_rows(self):
        result = _make_csv(["Col"], [])
        assert isinstance(result, bytes)
        assert b"Col" in result

    def test_utf8_bom(self):
        result = _make_csv(["Поле"], [["данные"]])
        assert result[:3] == b"\xef\xbb\xbf"


class TestExportUsersCsv:
    @pytest.mark.asyncio
    async def test_returns_csv_bytes(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_users", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [_make_user()]
            result = await export_users_csv(session)
        assert isinstance(result, bytes)
        content = result.decode("utf-8-sig")
        assert "Иван Иванов" in content
        assert "79001234567" in content

    @pytest.mark.asyncio
    async def test_includes_all_headers(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_users", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = []
            result = await export_users_csv(session)
        content = result.decode("utf-8-sig")
        for col in ["ID", "Имя", "Телефон", "Email", "Telegram", "Права", "Активен"]:
            assert col in content

    @pytest.mark.asyncio
    async def test_date_range_defaults_applied(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_users", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = []
            await export_users_csv(session)
            call_kwargs = mock_get.call_args.kwargs
            assert "date_from" in call_kwargs
            assert "date_to" in call_kwargs

    @pytest.mark.asyncio
    async def test_explicit_date_range(self):
        session = AsyncMock()
        d_from = date(2026, 1, 1)
        d_to = date(2026, 1, 31)
        with patch("features.admin.export.crud.get_all_users", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = []
            await export_users_csv(session, date_from=d_from, date_to=d_to)
            call_kwargs = mock_get.call_args.kwargs
            assert call_kwargs["date_from"] == d_from
            assert call_kwargs["date_to"] == d_to

    @pytest.mark.asyncio
    async def test_marks_inactive_users(self):
        session = AsyncMock()
        user = _make_user()
        user.is_active = False
        with patch("features.admin.export.crud.get_all_users", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [user]
            result = await export_users_csv(session)
        content = result.decode("utf-8-sig")
        assert "Нет" in content


class TestExportOrdersCsv:
    @pytest.mark.asyncio
    async def test_returns_csv_bytes(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_orders", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [_make_order()]
            result = await export_orders_csv(session)
        assert isinstance(result, bytes)
        content = result.decode("utf-8-sig")
        assert "A-101" in content
        assert "Тест Кафе" in content

    @pytest.mark.asyncio
    async def test_includes_all_headers(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_orders", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = []
            result = await export_orders_csv(session)
        content = result.decode("utf-8-sig")
        for col in ["ID", "Номер", "Клиент", "Ресторан", "Статус", "Сумма"]:
            assert col in content

    @pytest.mark.asyncio
    async def test_status_filter_passed(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_orders", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = []
            await export_orders_csv(session, status=OrderStatus.COMPLETED)
            call_kwargs = mock_get.call_args.kwargs
            assert call_kwargs["status"] == OrderStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_empty_orders(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_orders", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = []
            result = await export_orders_csv(session)
        assert isinstance(result, bytes)


class TestExportRestaurantsCsv:
    @pytest.mark.asyncio
    async def test_returns_csv_with_data(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_restaurants", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [_make_restaurant()]
            result = await export_restaurants_csv(session)
        content = result.decode("utf-8-sig")
        assert "Тест Кафе" in content
        assert "ул. Ленина, 1" in content

    @pytest.mark.asyncio
    async def test_includes_rating_and_counts(self):
        session = AsyncMock()
        resto = _make_restaurant()
        resto.average_rating = 4.8
        resto.review_count = 25
        resto.orders_count = 500
        with patch("features.admin.export.crud.get_all_restaurants", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [resto]
            result = await export_restaurants_csv(session)
        content = result.decode("utf-8-sig")
        assert "4.8" in content


class TestExportVendorsCsv:
    @pytest.mark.asyncio
    async def test_returns_csv_with_vendor_data(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_vendors", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [_make_vendor()]
            result = await export_vendors_csv(session)
        content = result.decode("utf-8-sig")
        assert "Вендор Иван" in content
        assert "APPROVED" in content

    @pytest.mark.asyncio
    async def test_restaurant_count_in_row(self):
        session = AsyncMock()
        v = _make_vendor()
        v.restaurants = [MagicMock(), MagicMock(), MagicMock()]
        with patch("features.admin.export.crud.get_all_vendors", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [v]
            result = await export_vendors_csv(session)
        content = result.decode("utf-8-sig")
        assert "3" in content


class TestExportReviewsCsv:
    @pytest.mark.asyncio
    async def test_returns_csv_with_review_data(self):
        session = AsyncMock()
        with patch("features.admin.export.crud.get_all_reviews", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [_make_review()]
            result = await export_reviews_csv(session)
        content = result.decode("utf-8-sig")
        assert "Тест Кафе" in content
        assert "Отлично!" in content

    @pytest.mark.asyncio
    async def test_min_rating_filter(self):
        session = AsyncMock()
        reviews = [_make_review(), _make_review()]
        reviews[0].rating = 2
        reviews[1].rating = 5
        with patch("features.admin.export.crud.get_all_reviews", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = reviews
            result = await export_reviews_csv(session, min_rating=4)
        content = result.decode("utf-8-sig")
        lines = [l for l in content.split("\n") if l.strip()]
        assert len(lines) == 2

    @pytest.mark.asyncio
    async def test_max_rating_filter(self):
        session = AsyncMock()
        reviews = [_make_review(), _make_review()]
        reviews[0].rating = 3
        reviews[1].rating = 5
        with patch("features.admin.export.crud.get_all_reviews", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = reviews
            result = await export_reviews_csv(session, max_rating=4)
        content = result.decode("utf-8-sig")
        lines = [l for l in content.split("\n") if l.strip()]
        assert len(lines) == 2

    @pytest.mark.asyncio
    async def test_verified_purchase_yes(self):
        session = AsyncMock()
        rv = _make_review()
        rv.is_verified_purchase = True
        with patch("features.admin.export.crud.get_all_reviews", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = [rv]
            result = await export_reviews_csv(session)
        content = result.decode("utf-8-sig")
        assert "Да" in content
