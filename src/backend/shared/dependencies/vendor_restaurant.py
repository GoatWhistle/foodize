import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.models import Restaurant
from features.vendors.models import VendorProfile


def get_vendor_restaurant_ids(vendor: VendorProfile) -> set[uuid.UUID]:
    return {r.id for r in (vendor.restaurants or [])}


def ensure_restaurant_belongs_to_vendor(
    vendor: VendorProfile, restaurant_id: uuid.UUID | None
) -> None:
    if restaurant_id is None:
        return
    if restaurant_id not in get_vendor_restaurant_ids(vendor):
        raise RestaurantNotFoundException()


async def get_owned_restaurant_or_403(
    session: AsyncSession, restaurant_id: uuid.UUID, vendor_id: uuid.UUID
) -> Restaurant:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant or restaurant.vendor_id != vendor_id:
        raise RestaurantNotFoundException()
    return restaurant
