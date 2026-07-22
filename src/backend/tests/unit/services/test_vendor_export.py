import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.vendors import export as vendor_export
from features.vendors.export import (
    _order_row,
    _owned_restaurant_ids,
    export_analytics_pdf,
    export_finance_pdf,
    export_menu_csv,
    export_orders_csv,
    export_promos_csv,
)
from shared.enums.order_status import OrderStatus


def _make_vendor(restaurant_ids: list[uuid.UUID]) -> MagicMock:
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    vendor.restaurants = [MagicMock(id=rid) for rid in restaurant_ids]
    return vendor


def _make_order(restaurant_id: uuid.UUID, *, with_relations: bool = True) -> MagicMock:
    order = MagicMock()
    order.id = uuid.uuid4()
    order.display_id = "A-101"
    order.restaurant_id = restaurant_id
    order.status = OrderStatus.COMPLETED.value
    order.total_price = 1500
    order.items = [MagicMock(), MagicMock()]
    order.created_at = datetime(2026, 1, 15, 12, 0, tzinfo=UTC)
    if with_relations:
        order.user = MagicMock(name="Клиент")
        order.user.name = "Клиент"
        order.restaurant = MagicMock()
        order.restaurant.name = "Тест Кафе"
    else:
        order.user = None
        order.restaurant = None
    return order


def _make_menu_item(restaurant_id: uuid.UUID, *, deleted: bool = False) -> MagicMock:
    item = MagicMock()
    item.id = uuid.uuid4()
    item.name = "Пицца"
    item.category = "pizza"
    item.price = 500
    item.is_available = True
    item.is_deleted = deleted
    item.restaurant_id = restaurant_id
    return item


def _make_promo() -> MagicMock:
    promo = MagicMock()
    promo.code = "SAVE10"
    promo.discount_type = "percent"
    promo.discount_value = 10
    promo.max_uses = None
    promo.used_count = 3
    promo.is_active = True
    promo.created_at = datetime(2026, 1, 10, 9, 0, tzinfo=UTC)
    return promo


class TestOwnedRestaurantIds:
    def test_matching_restaurant_id_narrows(self) -> None:
        rid = uuid.uuid4()
        vendor = _make_vendor([rid, uuid.uuid4()])
        assert _owned_restaurant_ids(vendor, rid) == [rid]

    def test_non_matching_restaurant_id_returns_all(self) -> None:
        rid = uuid.uuid4()
        vendor = _make_vendor([rid])
        result = _owned_restaurant_ids(vendor, uuid.uuid4())
        assert result == [rid]

    def test_none_returns_all(self) -> None:
        rids = [uuid.uuid4(), uuid.uuid4()]
        vendor = _make_vendor(rids)
        assert set(_owned_restaurant_ids(vendor, None)) == set(rids)


class TestOrderRow:
    def test_uses_relations(self) -> None:
        rid = uuid.uuid4()
        row = _order_row(_make_order(rid), "ru")
        assert row[2] == "Клиент"
        assert row[3] == "Тест Кафе"
        assert row[5] == 2

    def test_missing_relations_fallback(self) -> None:
        order = _make_order(uuid.uuid4(), with_relations=False)
        order.display_id = None
        row = _order_row(order, "ru")
        assert row[2] == ""
        assert row[3] == ""
        assert row[1] == str(order.id)[:8]


class TestExportOrdersCsv:
    async def test_restaurant_not_owned_returns_empty(self) -> None:
        vendor = _make_vendor([uuid.uuid4()])
        result = await export_orders_csv(AsyncMock(), vendor, restaurant_id=uuid.uuid4())
        content = result.decode("utf-8-sig")
        assert "ID" in content
        assert "A-101" not in content

    async def test_owned_restaurant_id_passed_through(self) -> None:
        rid = uuid.uuid4()
        vendor = _make_vendor([rid])
        with patch(
            "features.vendors.export.admin_crud.get_all_orders",
            new_callable=AsyncMock,
            return_value=[_make_order(rid)],
        ) as mock_get:
            result = await export_orders_csv(AsyncMock(), vendor, restaurant_id=rid)
        assert mock_get.call_args.kwargs["restaurant_id"] == rid
        assert "Тест Кафе" in result.decode("utf-8-sig")

    async def test_default_period_applied_and_filters_by_owned(self) -> None:
        owned = uuid.uuid4()
        other = uuid.uuid4()
        vendor = _make_vendor([owned])
        orders = [_make_order(owned), _make_order(other)]
        with patch(
            "features.vendors.export.admin_crud.get_all_orders",
            new_callable=AsyncMock,
            return_value=orders,
        ) as mock_get:
            result = await export_orders_csv(AsyncMock(), vendor)
        kwargs = mock_get.call_args.kwargs
        assert kwargs["date_from"] is not None
        assert kwargs["date_to"] is not None
        assert kwargs["restaurant_id"] is None
        assert result.decode("utf-8-sig").count("A-101") == 1

    async def test_explicit_dates_not_overwritten(self) -> None:
        owned = uuid.uuid4()
        vendor = _make_vendor([owned])
        d_from = date(2026, 1, 1)
        d_to = date(2026, 2, 1)
        with patch(
            "features.vendors.export.admin_crud.get_all_orders",
            new_callable=AsyncMock,
            return_value=[],
        ) as mock_get:
            await export_orders_csv(
                AsyncMock(),
                vendor,
                date_from=d_from,
                date_to=d_to,
                status=OrderStatus.COMPLETED,
            )
        kwargs = mock_get.call_args.kwargs
        assert kwargs["date_from"] == d_from
        assert kwargs["date_to"] == d_to
        assert kwargs["status"] == OrderStatus.COMPLETED


class TestExportMenuCsv:
    async def test_aggregates_and_skips_deleted(self) -> None:
        rid = uuid.uuid4()
        vendor = _make_vendor([rid])
        items = [_make_menu_item(rid), _make_menu_item(rid, deleted=True)]
        with patch.object(
            vendor_export,
            "get_menu_items",
            new_callable=AsyncMock,
            return_value=items,
        ):
            result = await export_menu_csv(AsyncMock(), vendor, restaurant_id=rid)
        content = result.decode("utf-8-sig")
        assert content.count("Пицца") == 1
        assert "Название" in content

    async def test_multiple_restaurants(self) -> None:
        r1, r2 = uuid.uuid4(), uuid.uuid4()
        vendor = _make_vendor([r1, r2])
        with patch.object(
            vendor_export,
            "get_menu_items",
            new_callable=AsyncMock,
            side_effect=[[_make_menu_item(r1)], [_make_menu_item(r2)]],
        ) as mock_items:
            result = await export_menu_csv(AsyncMock(), vendor)
        assert mock_items.await_count == 2
        assert result.decode("utf-8-sig").count("Пицца") == 2


class TestExportPromosCsv:
    async def test_returns_rows(self) -> None:
        rid = uuid.uuid4()
        vendor = _make_vendor([rid])
        with patch.object(
            vendor_export,
            "get_promos_by_restaurant_ids",
            new_callable=AsyncMock,
            return_value=[_make_promo()],
        ):
            result = await export_promos_csv(AsyncMock(), vendor, restaurant_id=rid)
        content = result.decode("utf-8-sig")
        assert "SAVE10" in content
        assert "∞" in content

    async def test_finite_max_uses(self) -> None:
        rid = uuid.uuid4()
        vendor = _make_vendor([rid])
        promo = _make_promo()
        promo.max_uses = 50
        promo.is_active = False
        with patch.object(
            vendor_export,
            "get_promos_by_restaurant_ids",
            new_callable=AsyncMock,
            return_value=[promo],
        ):
            result = await export_promos_csv(AsyncMock(), vendor)
        content = result.decode("utf-8-sig")
        assert "50" in content
        assert "Нет" in content


class TestExportPdf:
    async def test_finance_pdf(self) -> None:
        vendor = _make_vendor([uuid.uuid4()])
        with (
            patch(
                "features.vendors.export.admin_crud.get_finance_analytics",
                new_callable=AsyncMock,
                return_value=MagicMock(),
            ) as mock_finance,
            patch.object(
                vendor_export,
                "_build_finance_pdf",
                return_value=b"%PDF-fin",
            ) as mock_build,
        ):
            result = await export_finance_pdf(AsyncMock(), vendor)
        assert result == b"%PDF-fin"
        assert mock_finance.call_args.kwargs["vendor_id"] == vendor.id
        mock_build.assert_called_once()

    async def test_analytics_pdf(self) -> None:
        vendor = _make_vendor([uuid.uuid4()])
        with (
            patch(
                "features.vendors.export.admin_crud.get_advanced_analytics",
                new_callable=AsyncMock,
                return_value=MagicMock(),
            ) as mock_adv,
            patch.object(
                vendor_export,
                "_build_analytics_pdf",
                return_value=b"%PDF-an",
            ),
        ):
            result = await export_analytics_pdf(AsyncMock(), vendor)
        assert result == b"%PDF-an"
        assert mock_adv.call_args.kwargs["vendor_id"] == vendor.id


if __name__ == "__main__":
    pytest.main([__file__, "-q"])
