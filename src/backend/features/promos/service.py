import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from features.promos import crud
from features.promos.exceptions import (
    PromoAlreadyExistsException,
    PromoNotActiveException,
    PromoNotFoundException,
    PromoRestaurantMismatchException,
    PromoUsageLimitException,
)
from features.promos.models import Promo
from features.promos.schemas import PromoCreate, PromoResponse, PromoValidateResponse
from features.restaurants.exceptions import RestaurantNotFoundException


async def create_promo(
    session: AsyncSession,
    data: PromoCreate,
    vendor_restaurant_ids: list[uuid.UUID],
) -> PromoResponse:
    if data.restaurant_id not in vendor_restaurant_ids:
        raise RestaurantNotFoundException()

    existing = await crud.get_promo_by_code(session, data.code)
    if existing:
        raise PromoAlreadyExistsException()

    promo = await crud.create_promo(session, data)
    return PromoResponse.model_validate(promo)


async def get_vendor_promos(
    session: AsyncSession,
    vendor_restaurant_ids: list[uuid.UUID],
    page: int = 1,
    size: int = 20,
) -> tuple[list[PromoResponse], int]:
    offset = (page - 1) * size
    results = await crud.get_promos_by_restaurant_ids(
        session, vendor_restaurant_ids, offset=offset, limit=size
    )
    total = await crud.count_promos_by_restaurant_ids(session, vendor_restaurant_ids)
    return [PromoResponse.model_validate(p) for p in results], total


async def deactivate_promo(
    session: AsyncSession,
    code: str,
    vendor_restaurant_ids: list[uuid.UUID],
) -> PromoResponse:
    promo = await crud.get_promo_by_code(session, code)
    if not promo or promo.restaurant_id not in vendor_restaurant_ids:
        raise PromoNotFoundException()
    updated = await crud.deactivate_promo(session, promo)
    return PromoResponse.model_validate(updated)


def _validate_promo_active(promo: Promo, restaurant_id: uuid.UUID) -> None:
    if promo.restaurant_id != restaurant_id:
        raise PromoRestaurantMismatchException()
    if not promo.is_active:
        raise PromoNotActiveException()
    if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
        raise PromoNotActiveException()
    if promo.max_uses is not None and promo.used_count >= promo.max_uses:
        raise PromoUsageLimitException()


async def validate_promo(
    session: AsyncSession,
    code: str,
    restaurant_id: uuid.UUID,
    order_total: int | None = None,
) -> PromoValidateResponse:
    promo = await crud.get_promo_by_code(session, code)
    if not promo:
        raise PromoNotFoundException()
    _validate_promo_active(promo, restaurant_id)

    discounted_amount: int | None = None
    if order_total is not None:
        if promo.discount_type == "PERCENT":
            discounted_amount = max(0, order_total - int(order_total * promo.discount_value / 100))
        else:
            discounted_amount = max(0, order_total - promo.discount_value)

    return PromoValidateResponse(
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        discounted_amount=discounted_amount,
    )


async def apply_promo(
    session: AsyncSession,
    code: str,
    restaurant_id: uuid.UUID,
    order_total: int,
) -> int:
    promo = await crud.get_promo_by_code(session, code)
    if not promo:
        raise PromoNotFoundException()
    _validate_promo_active(promo, restaurant_id)

    if promo.discount_type == "PERCENT":
        new_total = max(0, order_total - int(order_total * promo.discount_value / 100))
    else:
        new_total = max(0, order_total - promo.discount_value)

    await crud.increment_used_count(session, promo)
    return new_total
