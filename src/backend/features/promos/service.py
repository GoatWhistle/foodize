import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log import service as audit_service
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
from shared.enums.discount_type import DiscountType
from shared.exceptions.base import AppException


async def create_promo(
    session: AsyncSession,
    data: PromoCreate,
    vendor_restaurant_ids: list[uuid.UUID],
    actor_id: uuid.UUID | None = None,
) -> PromoResponse:
    if data.restaurant_id not in vendor_restaurant_ids:
        raise RestaurantNotFoundException()

    existing = await crud.get_promo_by_code(session, data.code)
    if existing:
        raise PromoAlreadyExistsException()

    promo = await crud.create_promo(session, data)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="CREATE_PROMO",
        entity_type="promo",
        entity_id=promo.id,
        details={"code": promo.code, "restaurant_id": str(promo.restaurant_id)},
    )
    await session.flush()
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
    actor_id: uuid.UUID | None = None,
) -> PromoResponse:
    promo = await crud.get_promo_by_code(session, code)
    if not promo or promo.restaurant_id not in vendor_restaurant_ids:
        raise PromoNotFoundException()
    updated = await crud.deactivate_promo(session, promo)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="DEACTIVATE_PROMO",
        entity_type="promo",
        entity_id=updated.id,
        details={"code": code},
    )
    await session.flush()
    return PromoResponse.model_validate(updated)


def _validate_promo_active(
    promo: Promo,
    restaurant_id: uuid.UUID,
    order_total: int | None = None,
    is_first_order: bool = False,
) -> None:
    if promo.restaurant_id != restaurant_id:
        raise PromoRestaurantMismatchException()
    if not promo.is_active:
        raise PromoNotActiveException()
    if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
        raise PromoNotActiveException()
    if promo.max_uses is not None and promo.used_count >= promo.max_uses:
        raise PromoUsageLimitException()
    if promo.first_order_only and not is_first_order:
        raise AppException(status_code=400, detail="promo_first_order_only")
    if promo.min_order_amount is not None and order_total is not None:
        if order_total < promo.min_order_amount:
            raise AppException(status_code=400, detail="promo_min_order_amount")


def _compute_discounted_total(promo: Promo, order_total: int, discount_base: int) -> int:
    if promo.discount_type == DiscountType.PERCENT.value:
        discount = int(discount_base * promo.discount_value / 100)
    else:
        discount = min(promo.discount_value, discount_base)
    return max(0, order_total - discount)


async def validate_promo(
    session: AsyncSession,
    code: str,
    restaurant_id: uuid.UUID,
    order_total: int | None = None,
    is_first_order: bool = False,
    discount_base: int | None = None,
    user_id: uuid.UUID | None = None,
) -> PromoValidateResponse:
    promo = await crud.get_promo_by_code(session, code)
    if not promo:
        raise PromoNotFoundException()
    _validate_promo_active(
        promo, restaurant_id, order_total=order_total, is_first_order=is_first_order
    )
    if user_id is not None and await crud.has_used_promo(session, promo.id, user_id):
        raise PromoUsageLimitException()

    discounted_amount: int | None = None
    if order_total is not None:
        base = discount_base if discount_base is not None else order_total
        discounted_amount = _compute_discounted_total(promo, order_total, base)

    return PromoValidateResponse(
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        discounted_amount=discounted_amount,
        first_order_only=promo.first_order_only,
        min_order_amount=promo.min_order_amount,
    )


async def get_promo_for_order(session: AsyncSession, code: str) -> Promo | None:
    return await crud.get_promo_by_code(session, code)


async def apply_promo(
    session: AsyncSession,
    code: str,
    restaurant_id: uuid.UUID,
    order_total: int,
    is_first_order: bool = False,
    user_id: uuid.UUID | None = None,
    discount_base: int | None = None,
) -> int:
    promo = await crud.get_promo_by_code(session, code)
    if not promo:
        raise PromoNotFoundException()
    _validate_promo_active(
        promo, restaurant_id, order_total=order_total, is_first_order=is_first_order
    )

    base = discount_base if discount_base is not None else order_total
    new_total = _compute_discounted_total(promo, order_total, base)

    if user_id is not None:
        reserved = await crud.reserve_promo_usage(session, promo.id, user_id)
        if not reserved:
            raise PromoUsageLimitException()

    incremented = await crud.increment_used_count(session, promo)
    if not incremented:
        raise PromoUsageLimitException()
    return new_total
