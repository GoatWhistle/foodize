import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from features.admin.export import (
    export_orders_csv,
    export_users_csv,
    make_csv,
)
from shared.enums.order_status import OrderStatus


def _make_user(uid: uuid.UUID | None = None) -> MagicMock:
    u = MagicMock()
    u.id = uid or uuid.uuid4()
    u.name = "Иван Иванов"
    u.phone_number = "79001234567"
    u.email = "ivan@example.com"
    u.telegram_username = "ivan_tg"
    u.permissions = ["customers:read"]
    u.is_active = True
    u.created_at = datetime(2026, 1, 15, 10, 0, tzinfo=UTC)
    return u


def _make_order(oid: uuid.UUID | None = None) -> MagicMock:
    o = MagicMock()
    o.id = oid or uuid.uuid4()
    o.display_id = "A-101"
    o.status = OrderStatus.COMPLETED
    o.total_price = 1500
    o.cancellation_reason = None
    o.created_at = datetime(2026, 1, 15, 12, 0, tzinfo=UTC)
    o.user = MagicMock()
    o.user.name = "Клиент"
    o.user.phone_number = "79009876543"
    o.restaurant = MagicMock()
    o.restaurant.name = "Тест Кафе"
    return o


class TestMakeCsv:
    def test_returns_bytes(self) -> None:
        result = make_csv(["A", "B"], [["1", "2"], ["3", "4"]])
        assert isinstance(result, bytes)

    def test_contains_headers(self) -> None:
        result = make_csv(["Имя", "Телефон"], []).decode("utf-8-sig")
        assert "Имя" in result
        assert "Телефон" in result

    def test_contains_rows(self) -> None:
        result = make_csv(["X"], [["val1"], ["val2"]]).decode("utf-8-sig")
        assert "val1" in result
        assert "val2" in result

    def test_empty_rows(self) -> None:
        result = make_csv(["Col"], [])
        assert isinstance(result, bytes)
        assert b"Col" in result

    def test_utf8_bom(self) -> None:
        result = make_csv(["Поле"], [["данные"]])
        assert result[:3] == b"\xef\xbb\xbf"


class TestExportUsersCsv:
    async def test_returns_csv_bytes(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_users", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [_make_user()]
            result = await export_users_csv(session)
        assert isinstance(result, bytes)
        content = result.decode("utf-8-sig")
        assert "Иван Иванов" in content
        assert "79001234567" in content

    async def test_includes_all_headers(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_users", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = []
            result = await export_users_csv(session)
        content = result.decode("utf-8-sig")
        for col in ["ID", "Имя", "Телефон", "Email", "Telegram", "Права", "Активен"]:
            assert col in content

    async def test_date_range_defaults_applied(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_users", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = []
            await export_users_csv(session)
            call_kwargs = mock_get.call_args.kwargs
            assert "date_from" in call_kwargs
            assert "date_to" in call_kwargs

    async def test_explicit_date_range(self) -> None:
        session = AsyncMock()
        d_from = date(2026, 1, 1)
        d_to = date(2026, 1, 31)
        with patch(
            "features.admin.export.csv_exports.crud.get_all_users", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = []
            await export_users_csv(session, date_from=d_from, date_to=d_to)
            call_kwargs = mock_get.call_args.kwargs
            assert call_kwargs["date_from"] == d_from
            assert call_kwargs["date_to"] == d_to

    async def test_marks_inactive_users(self) -> None:
        session = AsyncMock()
        user = _make_user()
        user.is_active = False
        with patch(
            "features.admin.export.csv_exports.crud.get_all_users", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [user]
            result = await export_users_csv(session)
        content = result.decode("utf-8-sig")
        assert "Нет" in content


class TestExportOrdersCsv:
    async def test_returns_csv_bytes(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_orders", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [_make_order()]
            result = await export_orders_csv(session)
        assert isinstance(result, bytes)
        content = result.decode("utf-8-sig")
        assert "A-101" in content
        assert "Тест Кафе" in content

    async def test_includes_all_headers(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_orders", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = []
            result = await export_orders_csv(session)
        content = result.decode("utf-8-sig")
        for col in ["ID", "Номер", "Клиент", "Ресторан", "Статус", "Сумма"]:
            assert col in content

    async def test_status_filter_passed(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_orders", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = []
            await export_orders_csv(session, status=OrderStatus.COMPLETED)
            call_kwargs = mock_get.call_args.kwargs
            assert call_kwargs["status"] == OrderStatus.COMPLETED

    async def test_empty_orders(self) -> None:
        session = AsyncMock()
        with patch(
            "features.admin.export.csv_exports.crud.get_all_orders", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = []
            result = await export_orders_csv(session)
        assert isinstance(result, bytes)
