from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user, update_user
from features.users.models import User
from features.users.schemas import UserCreate, UserUpdate
from features.vendors.crud import create_vendor_profile, get_vendor_by_user_id
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate
from seed.data import MODERATION_VENDORS
from shared.permissions import CUSTOMER_PERMISSIONS, VENDOR_PERMISSIONS, permissions_with


async def _ensure_user(session: AsyncSession, data: dict[str, Any]) -> User:
    result = await session.execute(
        select(User).where(User.phone_number == data["phone_number"])
    )
    user = result.scalar_one_or_none()
    if user is not None:
        return user
    user = await create_user(
        session,
        UserCreate(
            name=data["name"],
            phone_number=data["phone_number"],
            password=data["password"],
        ),
    )
    await update_user(
        session,
        user,
        UserUpdate(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            middle_name=data.get("middle_name"),
            email=data.get("email"),
        ),
    )
    return user


async def _ensure_vendor(
    session: AsyncSession, user: User, data: dict[str, Any]
) -> VendorProfile:
    user.permissions = permissions_with(
        user.permissions, CUSTOMER_PERMISSIONS | VENDOR_PERMISSIONS
    )
    await session.commit()

    vendor = await get_vendor_by_user_id(session, user.id)
    if vendor is None:
        vendor = await create_vendor_profile(session, user, VendorCreate())
    vendor.approval_status = data["approval_status"]
    vendor.rejection_reason = data.get("rejection_reason")
    await session.commit()
    return vendor


async def _ensure_restaurant(
    session: AsyncSession, vendor: VendorProfile, rd: dict[str, Any]
) -> None:
    result = await session.execute(
        select(Restaurant).where(Restaurant.address == rd["address"])
    )
    if result.scalar_one_or_none() is not None:
        print(f"  skip restaurant '{rd['name']}' (exists)")
        return
    restaurant = await create_restaurant(
        session,
        RestaurantCreate(name=rd["name"], address=rd["address"], avg_prep_time_minutes=15),
        vendor.id,
    )
    restaurant.moderation_status = rd["moderation_status"]
    restaurant.rejection_reason = rd.get("rejection_reason")
    restaurant.description = rd["description"]
    await session.commit()
    print(f"  restaurant '{rd['name']}' [{rd['moderation_status']}]")


async def seed_moderation(session: AsyncSession) -> None:
    print("\n── Moderation queue ────────────────────")
    for data in MODERATION_VENDORS:
        user = await _ensure_user(session, data)
        vendor = await _ensure_vendor(session, user, data)
        print(f"  vendor {data['name']} [{data['approval_status']}]")
        await _ensure_restaurant(session, vendor, data["restaurant"])
