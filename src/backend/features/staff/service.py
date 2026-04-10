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
from features.staff.schemas import StaffRequestCreate
from shared.enums.staff_request_status import StaffRequestStatus


async def create_new_staff_request(
    session: AsyncSession,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
    request_data: StaffRequestCreate,
):
    if not is_need_staff_for_restaurant(restaurant_id, session):
        raise RestaurantNotHiringException()
    if await crud.get_staff_profile_by_user_id(session, user_id):
        raise AlreadyStaffException()

    last_request = await crud.get_last_request(session, user_id, restaurant_id)

    if last_request:
        if last_request.status == StaffRequestStatus.PENDING:
            raise StaffRequestActiveExistsException()

        if last_request.status == StaffRequestStatus.REJECTED:
            now = datetime.now(timezone.utc)
            if now - last_request.updated_at < timedelta(hours=24):
                raise StaffRequestCooldownException()

    return await crud.create_staff_request_in_db(
        session=session, user_id=user_id, restaurant_id=restaurant_id, data=request_data
    )


async def process_staff_request(
    session: AsyncSession, request_id: uuid.UUID, new_status: StaffRequestStatus
):
    request = await crud.get_request_by_id(session, request_id)
    if not request:
        return None

    create_profile = False
    if new_status == StaffRequestStatus.ACCEPTED:
        if await crud.get_staff_profile_by_user_id(session, request.user_id):
            await crud.update_request_status_and_create_profile(
                session, request, StaffRequestStatus.REJECTED
            )
            raise AlreadyStaffException()
        create_profile = True

    return await crud.update_request_status_and_create_profile(
        session=session, request=request, new_status=new_status, create_profile=create_profile
    )


async def get_vendor_staff_requests(session: AsyncSession, vendor_id: uuid.UUID):
    return await crud.get_requests_by_vendor_id(session, vendor_id)
