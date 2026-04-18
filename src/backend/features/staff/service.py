import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from features.staff import crud
from features.staff.dependencies import is_need_staff_for_restaurant
from features.staff.exceptions import (
    AlreadyStaffException,
    RestaurantNotHiringException,
    StaffRequestActiveExistsException,
    StaffRequestCooldownException,
)
from features.staff.models import StaffRequest
from features.staff.schemas import StaffRequestCreate, StaffRequestResponse
from shared.enums.staff_request_status import StaffRequestStatus


async def create_staff_request(
    session: AsyncSession,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
    request_data: StaffRequestCreate,
) -> StaffRequestResponse:
    if not await is_need_staff_for_restaurant(restaurant_id, session):
        raise RestaurantNotHiringException()
    if await crud.get_staff_profile_by_user_id(session, user_id):
        raise AlreadyStaffException()

    last_request = await crud.get_last_request(session, user_id, restaurant_id)
    if last_request:
        if last_request.status == StaffRequestStatus.PENDING.value:
            raise StaffRequestActiveExistsException()
        if last_request.status == StaffRequestStatus.REJECTED.value:
            if datetime.now(timezone.utc) - last_request.updated_at < timedelta(hours=24):
                raise StaffRequestCooldownException()

    request = await crud.create_staff_request(
        session=session, user_id=user_id, restaurant_id=restaurant_id, data=request_data
    )
    return StaffRequestResponse.model_validate(request)


async def process_staff_request(
    session: AsyncSession, request: StaffRequest, new_status: StaffRequestStatus
) -> StaffRequestResponse | None:
    if not request:
        return None

    if new_status == StaffRequestStatus.ACCEPTED:
        if await crud.get_staff_profile_by_user_id(session, request.user_id):
            await crud.update_request_status(session, request, StaffRequestStatus.REJECTED)
            raise AlreadyStaffException()
        await crud.create_staff_profile(session, request.user_id, request.restaurant_id)

    updated = await crud.update_request_status(session, request, new_status)
    return StaffRequestResponse.model_validate(updated)


async def get_vendor_staff_requests(
    session: AsyncSession,
    vendor_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
) -> tuple[list[StaffRequestResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_requests_by_vendor_id(session, vendor_id, offset=offset, limit=size)
    total = await crud.count_requests_by_vendor_id(session, vendor_id)
    return [StaffRequestResponse.model_validate(r) for r in data], total
