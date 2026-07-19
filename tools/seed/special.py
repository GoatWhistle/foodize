from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item
from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.models import User
from features.vendors.crud import create_vendor_profile, get_vendor_by_user_id
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate
from seed.fixtures.special_vendor import (
    SPECIAL_VENDOR_ADDRESS,
    SPECIAL_VENDOR_ITEMS,
    SPECIAL_VENDOR_PHONE,
    SPECIAL_VENDOR_RESTAURANT,
)
from shared.enums.moderation_status import ModerationStatus
from shared.permissions import CUSTOMER_PERMISSIONS, VENDOR_PERMISSIONS, permissions_with

APPROVED = ModerationStatus.APPROVED.value
SPECIAL_VENDOR_AVG_PREP_TIME_MINUTES = 15


async def _ensure_special_vendor(session: AsyncSession, user: User) -> VendorProfile:
    user.permissions = permissions_with(
        user.permissions, CUSTOMER_PERMISSIONS | VENDOR_PERMISSIONS
    )
    await session.commit()

    vendor = await get_vendor_by_user_id(session, user.id)
    if vendor is None:
        vendor = await create_vendor_profile(session, user, VendorCreate())
        print(f"  vendor profile → {user.name} ({SPECIAL_VENDOR_PHONE})")
    vendor.approval_status = APPROVED
    vendor.rejection_reason = None
    await session.commit()
    return vendor


async def _ensure_special_restaurant(
    session: AsyncSession, vendor: VendorProfile
) -> Restaurant:
    result = await session.execute(
        select(Restaurant).where(
            Restaurant.vendor_id == vendor.id,
            Restaurant.name == SPECIAL_VENDOR_RESTAURANT,
        )
    )
    restaurant = result.scalar_one_or_none()
    if restaurant is None:
        restaurant = await create_restaurant(
            session,
            RestaurantCreate(
                name=SPECIAL_VENDOR_RESTAURANT,
                address=SPECIAL_VENDOR_ADDRESS,
                avg_prep_time_minutes=SPECIAL_VENDOR_AVG_PREP_TIME_MINUTES,
            ),
            vendor.id,
        )
        restaurant.moderation_status = APPROVED
        restaurant.description = "Шаурма и напитки от Бороды"
        await session.commit()
        print(f"  restaurant '{SPECIAL_VENDOR_RESTAURANT}'")
    return restaurant


async def _add_special_menu(session: AsyncSession, restaurant: Restaurant) -> None:
    existing = await session.execute(
        select(MenuItem.name).where(MenuItem.restaurant_id == restaurant.id)
    )
    existing_names = {name for (name,) in existing.all()}
    added = 0
    for item in SPECIAL_VENDOR_ITEMS:
        if item["name"] in existing_names:
            continue
        await create_menu_item(
            session,
            MenuItemCreate(
                name=item["name"],
                description=item["description"],
                price=item["price"],
                category=item["category"],
                prep_time_minutes=item["prep_time_minutes"],
            ),
            restaurant.id,
        )
        added += 1
    print(f"    +{added} menu items for '{SPECIAL_VENDOR_RESTAURANT}'")


async def promote_special_vendor(session: AsyncSession) -> None:
    result = await session.execute(
        select(User).where(User.phone_number == SPECIAL_VENDOR_PHONE)
    )
    user = result.scalar_one_or_none()
    if user is None:
        print(f"  skip special vendor: no user {SPECIAL_VENDOR_PHONE}")
        return

    vendor = await _ensure_special_vendor(session, user)
    restaurant = await _ensure_special_restaurant(session, vendor)
    await _add_special_menu(session, restaurant)
