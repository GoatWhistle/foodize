import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features import Restaurant, StaffRequest, VendorProfile
from features.staff import crud
from features.vendors.dependencies import get_current_vendor
from shared.exceptions import NotFoundException


async def get_valid_staff_request(
    request_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    current_vendor: VendorProfile = Depends(get_current_vendor),
) -> StaffRequest:
    request = await crud.get_request_by_id(session, request_id)

    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff request not found")

    stmt = select(Restaurant).where(Restaurant.id == request.restaurant_id)
    res = await session.execute(stmt)
    restaurant = res.scalar_one_or_none()

    if not restaurant or restaurant.vendor_id != current_vendor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage this request",
        )

    return request


async def get_restaurant_or_404(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    restaurant = await session.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise NotFoundException()


async def is_need_staff_for_restaurant(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    restaurant = await get_restaurant_or_404(restaurant_id, session)
    return restaurant.is_hiring
