import uuid
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from features.staff.models import StaffRequest

from features.staff import crud
from features.staff.dependencies import is_need_staff_for_restaurant
from features.staff.exceptions import (
    AlreadyStaffException,
    RestaurantNotHiringException,
    StaffRequestActiveExistsException,
    StaffRequestCooldownException,
)
from features.staff.schemas import StaffRequestCreate
from shared.enums.staff_request_status import StaffRequestStatus


async def create_staff_request(
    session: AsyncSession,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
    request_data: StaffRequestCreate,
) -> "StaffRequest":
    if not await is_need_staff_for_restaurant(restaurant_id, session):
        raise RestaurantNotHiringException()
    if await crud.get_staff_profile_by_user_id(session, user_id):
        raise AlreadyStaffException()

    last_request = await crud.get_last_request(session, user_id, restaurant_id)
    if last_request:
        if last_request.status == StaffRequestStatus.PENDING:
            raise StaffRequestActiveExistsException()
        if last_request.status == StaffRequestStatus.REJECTED:
            if datetime.now(timezone.utc) - last_request.updated_at < timedelta(hours=24):
                raise StaffRequestCooldownException()

    return await crud.create_staff_request(
        session=session, user_id=user_id, restaurant_id=restaurant_id, data=request_data
    )


async def process_staff_request(
    session: AsyncSession, request: "StaffRequest", new_status: StaffRequestStatus
) -> "StaffRequest | None":
    if not request:
        return None

    if new_status == StaffRequestStatus.ACCEPTED:
        if await crud.get_staff_profile_by_user_id(session, request.user_id):
            await crud.update_request_status(session, request, StaffRequestStatus.REJECTED)
            raise AlreadyStaffException()
        await crud.create_staff_profile(session, request.user_id, request.restaurant_id)

    return await crud.update_request_status(session, request, new_status)


async def get_vendor_staff_requests(
    session: AsyncSession, vendor_id: uuid.UUID
) -> list["StaffRequest"]:
    return await crud.get_requests_by_vendor_id(session, vendor_id)
