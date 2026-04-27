import uuid

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.orders.crud.order import get_order_by_id
from features.orders.models import Order
from features.restaurants.models import Restaurant
from features.staff.models import StaffProfile
from features.users.models import User
from features.vendors.crud import get_vendor_by_user_id
from shared.enums.roles import UserRole
from shared.exceptions import AccessDeniedException, NotFoundException


async def verify_restaurant_access(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    current_user: User,
) -> Restaurant:
    restaurant = await session.get(Restaurant, restaurant_id)
    if not restaurant:
        raise NotFoundException(detail="Restaurant not found")

    if current_user.user_role == UserRole.VENDOR.value:
        vendor = await get_vendor_by_user_id(session, current_user.id)
        if not vendor or vendor.id != restaurant.vendor_id:
            raise AccessDeniedException()

    elif current_user.user_role == UserRole.STAFF.value:
        result = await session.execute(
            select(StaffProfile).where(
                StaffProfile.user_id == current_user.id,
                StaffProfile.restaurant_id == restaurant_id,
            )
        )
        if not result.scalar_one_or_none():
            raise AccessDeniedException()

    else:
        raise AccessDeniedException(detail="Only VENDOR and STAFF can access orders")

    return restaurant


async def get_restaurant_staff_or_vendor(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    current_user: User = Depends(get_current_user),
) -> Restaurant:
    return await verify_restaurant_access(session, restaurant_id, current_user)


async def get_order_for_staff_or_vendor(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    current_user: User = Depends(get_current_user),
) -> Order:
    order = await get_order_by_id(session, order_id)
    if not order:
        raise NotFoundException(detail="Order not found")
    await verify_restaurant_access(session, order.restaurant_id, current_user)
    return order
