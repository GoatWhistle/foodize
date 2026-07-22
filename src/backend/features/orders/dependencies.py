import uuid

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.orders.crud.order import get_order_by_id_for_update
from features.orders.exceptions import OrderNotFoundException, OrdersRestaurantAccessDeniedException
from features.orders.models import Order
from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.models import Restaurant
from features.staff.models import StaffProfile
from features.users.models import User
from features.vendors.crud import get_vendor_by_user_id
from shared.enums.permissions import Permission
from shared.permissions import has_permission


async def verify_restaurant_access(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    current_user: User,
) -> Restaurant:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()

    if has_permission(current_user.permissions, Permission.ORDERS_MODERATE):
        return restaurant

    if not has_permission(current_user.permissions, Permission.ORDERS_READ_RESTAURANT):
        raise OrdersRestaurantAccessDeniedException()

    if has_permission(current_user.permissions, Permission.VENDORS_READ_OWN):
        vendor = await get_vendor_by_user_id(session, current_user.id)
        if vendor and vendor.id == restaurant.vendor_id:
            return restaurant
        if vendor:
            raise OrdersRestaurantAccessDeniedException()

    result = await session.execute(
        select(StaffProfile).where(
            StaffProfile.user_id == current_user.id,
            StaffProfile.restaurant_id == restaurant_id,
        )
    )
    if result.scalar_one_or_none():
        return restaurant

    raise OrdersRestaurantAccessDeniedException()


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
    order = await get_order_by_id_for_update(session, order_id)
    if not order:
        raise OrderNotFoundException()
    await verify_restaurant_access(session, order.restaurant_id, current_user)
    return order
