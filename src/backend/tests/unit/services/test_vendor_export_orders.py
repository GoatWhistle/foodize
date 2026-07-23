import uuid
from datetime import date
from unittest.mock import AsyncMock, patch

from features.vendors.export import export_orders_csv, order_row, owned_restaurant_ids
from shared.enums.order_status import OrderStatus

from .vendor_export_helpers import make_order, make_vendor


class TestOwnedRestaurantIds:
    def test_matching_restaurant_id_narrows(self) -> None:
        rid = uuid.uuid4()
        vendor = make_vendor([rid, uuid.uuid4()])
        assert owned_restaurant_ids(vendor, rid) == [rid]

    def test_non_matching_restaurant_id_returns_all(self) -> None:
        rid = uuid.uuid4()
        vendor = make_vendor([rid])
        result = owned_restaurant_ids(vendor, uuid.uuid4())
        assert result == [rid]

    def test_none_returns_all(self) -> None:
        rids = [uuid.uuid4(), uuid.uuid4()]
        vendor = make_vendor(rids)
        assert set(owned_restaurant_ids(vendor, None)) == set(rids)


class TestOrderRow:
    def test_uses_relations(self) -> None:
        rid = uuid.uuid4()
        row = order_row(make_order(rid), "ru")
        assert row[2] == "Клиент"
        assert row[3] == "Тест Кафе"
        assert row[5] == 2

    def test_missing_relations_fallback(self) -> None:
        order = make_order(uuid.uuid4(), with_relations=False)
        order.display_id = None
        row = order_row(order, "ru")
        assert row[2] == ""
        assert row[3] == ""
        assert row[1] == str(order.id)[:8]


class TestExportOrdersCsv:
    async def test_restaurant_not_owned_returns_empty(self) -> None:
        vendor = make_vendor([uuid.uuid4()])
        result = await export_orders_csv(AsyncMock(), vendor, restaurant_id=uuid.uuid4())
        content = result.decode("utf-8-sig")
        assert "ID" in content
        assert "A-101" not in content

    async def test_owned_restaurant_id_passed_through(self) -> None:
        rid = uuid.uuid4()
        vendor = make_vendor([rid])
        with patch(
            "features.vendors.export.admin_crud.get_all_orders",
            new_callable=AsyncMock,
            return_value=[make_order(rid)],
        ) as mock_get:
            result = await export_orders_csv(AsyncMock(), vendor, restaurant_id=rid)
        assert mock_get.call_args.kwargs["restaurant_id"] == rid
        assert "Тест Кафе" in result.decode("utf-8-sig")

    async def test_default_period_applied_and_filters_by_owned(self) -> None:
        owned = uuid.uuid4()
        other = uuid.uuid4()
        vendor = make_vendor([owned])
        orders = [make_order(owned), make_order(other)]
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
        vendor = make_vendor([owned])
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
