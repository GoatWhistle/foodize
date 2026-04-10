import uuid

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from features import Restaurant, StaffProfile, StaffRequest
from features.staff.schemas import StaffRequestCreate
from shared.enums.staff_request_status import StaffRequestStatus
from shared.enums.staff_roles import StaffRole


async def create_staff_request_in_db(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID, data: StaffRequestCreate
) -> StaffRequest:
    new_request = StaffRequest(user_id=user_id, restaurant_id=restaurant_id, message=data.message)
    session.add(new_request)
    await session.commit()
    await session.refresh(new_request)
    return new_request


async def get_last_request(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> StaffRequest | None:
    stmt = (
        select(StaffRequest)
        .where(and_(StaffRequest.user_id == user_id, StaffRequest.restaurant_id == restaurant_id))
        .order_by(StaffRequest.created_at.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_staff_profile_by_user_id(
    session: AsyncSession, user_id: uuid.UUID
) -> StaffProfile | None:
    stmt = select(StaffProfile).where(StaffProfile.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_request_by_id(session: AsyncSession, request_id: uuid.UUID) -> StaffRequest | None:
    return await session.get(StaffRequest, request_id)


async def get_requests_by_vendor_id(
    session: AsyncSession, vendor_id: uuid.UUID
) -> list[StaffRequest]:
    stmt = (
        select(StaffRequest)
        .join(Restaurant)
        .where(Restaurant.vendor_id == vendor_id)
        .order_by(StaffRequest.created_at.desc())
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_request_status_and_create_profile(
    session: AsyncSession,
    request: StaffRequest,
    new_status: StaffRequestStatus,
    create_profile: bool = False,
) -> StaffRequest:
    request.status = new_status
    if create_profile:
        new_profile = StaffProfile(
            user_id=request.user_id, restaurant_id=request.restaurant_id, role=StaffRole.COOK
        )
        session.add(new_profile)
    await session.commit()
    await session.refresh(request)
    return request
