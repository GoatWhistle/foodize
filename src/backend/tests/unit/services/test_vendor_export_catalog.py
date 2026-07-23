import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.vendors import export as vendor_export
from features.vendors.export import (
    export_analytics_pdf,
    export_finance_pdf,
    export_menu_csv,
    export_promos_csv,
)

from .vendor_export_helpers import make_menu_item, make_promo, make_vendor


class TestExportMenuCsv:
    async def test_aggregates_and_skips_deleted(self) -> None:
        rid = uuid.uuid4()
        vendor = make_vendor([rid])
        items = [make_menu_item(rid), make_menu_item(rid, deleted=True)]
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
        vendor = make_vendor([r1, r2])
        with patch.object(
            vendor_export,
            "get_menu_items",
            new_callable=AsyncMock,
            side_effect=[[make_menu_item(r1)], [make_menu_item(r2)]],
        ) as mock_items:
            result = await export_menu_csv(AsyncMock(), vendor)
        assert mock_items.await_count == 2
        assert result.decode("utf-8-sig").count("Пицца") == 2


class TestExportPromosCsv:
    async def test_returns_rows(self) -> None:
        rid = uuid.uuid4()
        vendor = make_vendor([rid])
        with patch.object(
            vendor_export,
            "get_promos_by_restaurant_ids",
            new_callable=AsyncMock,
            return_value=[make_promo()],
        ):
            result = await export_promos_csv(AsyncMock(), vendor, restaurant_id=rid)
        content = result.decode("utf-8-sig")
        assert "SAVE10" in content
        assert "∞" in content

    async def test_finite_max_uses(self) -> None:
        rid = uuid.uuid4()
        vendor = make_vendor([rid])
        promo = make_promo()
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
        vendor = make_vendor([uuid.uuid4()])
        with (
            patch(
                "features.vendors.export.admin_crud.get_finance_analytics",
                new_callable=AsyncMock,
                return_value=MagicMock(),
            ) as mock_finance,
            patch.object(
                vendor_export,
                "build_finance_pdf",
                return_value=b"%PDF-fin",
            ) as mock_build,
        ):
            result = await export_finance_pdf(AsyncMock(), vendor)
        assert result == b"%PDF-fin"
        assert mock_finance.call_args.kwargs["vendor_id"] == vendor.id
        mock_build.assert_called_once()

    async def test_analytics_pdf(self) -> None:
        vendor = make_vendor([uuid.uuid4()])
        with (
            patch(
                "features.vendors.export.admin_crud.get_advanced_analytics",
                new_callable=AsyncMock,
                return_value=MagicMock(),
            ) as mock_adv,
            patch.object(
                vendor_export,
                "build_analytics_pdf",
                return_value=b"%PDF-an",
            ),
        ):
            result = await export_analytics_pdf(AsyncMock(), vendor)
        assert result == b"%PDF-an"
        assert mock_adv.call_args.kwargs["vendor_id"] == vendor.id
