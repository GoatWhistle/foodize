import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.promos.exceptions import (
    PromoNotActiveException,
    PromoNotFoundException,
    PromoRestaurantMismatchException,
    PromoUsageLimitException,
)
from features.promos.service import validate_promo


def _make_promo(
    discount_type: str = "PERCENT",
    discount_value: int = 10,
    is_active: bool = True,
    max_uses: int | None = None,
    used_count: int = 0,
    expires_at: datetime | None = None,
) -> MagicMock:
    p = MagicMock()
    p.id = uuid.uuid4()
    p.code = "TEST10"
    p.discount_type = discount_type
    p.discount_value = discount_value
    p.restaurant_id = uuid.uuid4()
    p.max_uses = max_uses
    p.used_count = used_count
    p.expires_at = expires_at
    p.is_active = is_active
    p.created_at = datetime.now(UTC)
    p.first_order_only = False
    p.min_order_amount = None
    p.menu_category = None
    return p


class TestValidatePromo:
    async def test_not_found(self) -> None:
        with (
            patch(
                "features.promos.crud.get_promo_by_code",
                new_callable=AsyncMock,
                return_value=None,
            ),
            pytest.raises(PromoNotFoundException),
        ):
            await validate_promo(MagicMock(), "NOCODE", uuid.uuid4())

    async def test_restaurant_mismatch(self) -> None:
        promo = _make_promo()
        with (
            patch(
                "features.promos.crud.get_promo_by_code",
                new_callable=AsyncMock,
                return_value=promo,
            ),
            pytest.raises(PromoRestaurantMismatchException),
        ):
            await validate_promo(MagicMock(), "TEST10", uuid.uuid4())

    async def test_not_active(self) -> None:
        promo = _make_promo(is_active=False)
        with (
            patch(
                "features.promos.crud.get_promo_by_code",
                new_callable=AsyncMock,
                return_value=promo,
            ),
            pytest.raises(PromoNotActiveException),
        ):
            await validate_promo(MagicMock(), "TEST10", promo.restaurant_id)

    async def test_expired(self) -> None:
        promo = _make_promo(expires_at=datetime.now(UTC) - timedelta(hours=1))
        with (
            patch(
                "features.promos.crud.get_promo_by_code",
                new_callable=AsyncMock,
                return_value=promo,
            ),
            pytest.raises(PromoNotActiveException),
        ):
            await validate_promo(MagicMock(), "TEST10", promo.restaurant_id)

    async def test_not_expired_aware_datetime(self) -> None:
        promo = _make_promo(expires_at=datetime.now(UTC) + timedelta(hours=1))
        with patch(
            "features.promos.crud.get_promo_by_code",
            new_callable=AsyncMock,
            return_value=promo,
        ):
            result = await validate_promo(MagicMock(), "TEST10", promo.restaurant_id)
            assert result.code == promo.code

    async def test_usage_limit_reached(self) -> None:
        promo = _make_promo(max_uses=5, used_count=5)
        with (
            patch(
                "features.promos.crud.get_promo_by_code",
                new_callable=AsyncMock,
                return_value=promo,
            ),
            pytest.raises(PromoUsageLimitException),
        ):
            await validate_promo(MagicMock(), "TEST10", promo.restaurant_id)

    async def test_percent_discount(self) -> None:
        promo = _make_promo(discount_type="PERCENT", discount_value=10)
        with patch(
            "features.promos.crud.get_promo_by_code",
            new_callable=AsyncMock,
            return_value=promo,
        ):
            result = await validate_promo(
                MagicMock(), "TEST10", promo.restaurant_id, order_total=1000
            )
            assert result.discounted_amount == 900

    async def test_flat_discount(self) -> None:
        promo = _make_promo(discount_type="FIXED", discount_value=200)
        with patch(
            "features.promos.crud.get_promo_by_code",
            new_callable=AsyncMock,
            return_value=promo,
        ):
            result = await validate_promo(
                MagicMock(), "TEST10", promo.restaurant_id, order_total=1000
            )
            assert result.discounted_amount == 800

    async def test_no_order_total(self) -> None:
        promo = _make_promo()
        with patch(
            "features.promos.crud.get_promo_by_code",
            new_callable=AsyncMock,
            return_value=promo,
        ):
            result = await validate_promo(MagicMock(), "TEST10", promo.restaurant_id)
            assert result.discounted_amount is None
