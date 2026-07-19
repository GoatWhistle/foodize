import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.promos.crud import (
    count_promos_by_restaurant_ids,
    create_promo,
    deactivate_promo,
    get_promo_by_code,
    get_promos_by_restaurant_ids,
    get_restaurant_ids_by_vendor,
    increment_used_count,
)
from features.promos.schemas import PromoCreate


class TestGetRestaurantIdsByVendor:
    async def test_returns_ids(self) -> None:
        rid = uuid.uuid4()
        mock_result = MagicMock()
        mock_result.fetchall = MagicMock(return_value=[(rid,)])

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_restaurant_ids_by_vendor(session, uuid.uuid4())
        assert result == [rid]

    async def test_returns_empty(self) -> None:
        mock_result = MagicMock()
        mock_result.fetchall = MagicMock(return_value=[])

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_restaurant_ids_by_vendor(session, uuid.uuid4())
        assert result == []


class TestGetPromoByCode:
    async def test_found(self) -> None:
        promo = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=promo)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_promo_by_code(session, "TEST10")
        assert result == promo

    async def test_not_found(self) -> None:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_promo_by_code(session, "NOCODE")
        assert result is None


class TestGetPromosByRestaurantIds:
    async def test_empty_ids_returns_empty(self) -> None:
        session = AsyncMock()
        result = await get_promos_by_restaurant_ids(session, [])
        assert result == []
        session.execute.assert_not_called()

    async def test_with_ids(self) -> None:
        promo = MagicMock()
        mock_result = MagicMock()
        mock_result.scalars = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[promo])))

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_promos_by_restaurant_ids(session, [uuid.uuid4()])
        assert result == [promo]


class TestCountPromosByRestaurantIds:
    async def test_empty_ids_returns_zero(self) -> None:
        session = AsyncMock()
        result = await count_promos_by_restaurant_ids(session, [])
        assert result == 0
        session.execute.assert_not_called()

    async def test_with_ids(self) -> None:
        mock_result = MagicMock()
        mock_result.scalar_one = MagicMock(return_value=5)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await count_promos_by_restaurant_ids(session, [uuid.uuid4()])
        assert result == 5


class TestCreatePromo:
    async def test_creates_and_returns(self) -> None:
        data = PromoCreate(
            code="save20",
            discount_type="PERCENT",
            discount_value=20,
            restaurant_id=uuid.uuid4(),
        )

        session = AsyncMock()
        session.add = MagicMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()

        with patch("features.promos.crud.Promo") as MockPromo:
            mock_promo = MagicMock()
            MockPromo.return_value = mock_promo
            result = await create_promo(session, data)
            session.add.assert_called_once_with(mock_promo)
            session.flush.assert_awaited_once()
            session.refresh.assert_awaited_once_with(mock_promo)
            assert result == mock_promo


class TestDeactivatePromo:
    async def test_deactivates_and_returns(self) -> None:
        promo = MagicMock()
        promo.is_active = True

        session = AsyncMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()

        await deactivate_promo(session, promo)
        assert promo.is_active is False
        session.flush.assert_awaited_once()
        session.refresh.assert_awaited_once_with(promo)


class TestIncrementUsedCount:
    async def test_increments_and_commits(self) -> None:
        promo = MagicMock()
        promo.used_count = 3

        mock_result = MagicMock()
        mock_result.rowcount = 1

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await increment_used_count(session, promo)
        assert result is True
        session.execute.assert_awaited_once()
