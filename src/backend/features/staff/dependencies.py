import uuid

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.models import Restaurant
from features.staff import crud
from features.staff.exceptions import (
    StaffRequestAccessDeniedException,
    StaffRequestNotFoundException,
)
from features.staff.models import StaffRequest
from features.users.models import User
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from shared.dependencies import require_permission
from shared.enums.permissions import Permission


async def get_valid_staff_request(
    request_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    _user: User = Depends(require_permission(Permission.STAFF_REQUESTS_MANAGE)),
) -> StaffRequest:
    request = await crud.get_request_by_id(session, request_id)

    if not request:
        raise StaffRequestNotFoundException()

    restaurant = await get_restaurant_by_id(session, request.restaurant_id)

    if not restaurant or restaurant.vendor_id != current_vendor.id:
        raise StaffRequestAccessDeniedException()

    return request


async def get_restaurant_or_404(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> Restaurant:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if restaurant is None:
        raise RestaurantNotFoundException()
    return restaurant


async def is_need_staff_for_restaurant(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> bool:
    restaurant = await get_restaurant_or_404(restaurant_id, session)
    return restaurant.is_hiring
