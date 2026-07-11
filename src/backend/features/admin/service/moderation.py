import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.audit_log import service as audit_service
from features.admin.schemas import AdminRestaurantResponse, AdminVendorResponse
from features.admin.service.catalog import get_restaurant_or_404
from features.restaurants.models import Restaurant
from shared.exceptions import NotFoundException


async def moderate_vendor(
    session: AsyncSession,
    vendor_id: uuid.UUID,
    status: str,
    reason: str | None = None,
    actor_id: uuid.UUID | None = None,
) -> AdminVendorResponse:
    vendor = await crud.get_vendor_by_id(session, vendor_id)
    if not vendor:
        raise NotFoundException()
    old_status = vendor.approval_status
    updated = await crud.set_vendor_moderation(session, vendor, status, reason)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="MODERATE_VENDOR",
        entity_type="vendor",
        entity_id=vendor_id,
        details={"old": old_status, "new": status, "reason": reason},
    )
    await session.flush()
    return AdminVendorResponse.model_validate(updated)


async def moderate_restaurant(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    status: str,
    reason: str | None = None,
    actor_id: uuid.UUID | None = None,
) -> AdminRestaurantResponse:
    restaurant = await session.get(Restaurant, restaurant_id)
    if not restaurant:
        raise NotFoundException()
    old_status = restaurant.moderation_status
    updated = await crud.set_restaurant_moderation(session, restaurant, status, reason)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="MODERATE_RESTAURANT",
        entity_type="restaurant",
        entity_id=restaurant_id,
        details={"old": old_status, "new": status, "reason": reason},
    )
    await session.flush()
    return await get_restaurant_or_404(session, updated.id)
