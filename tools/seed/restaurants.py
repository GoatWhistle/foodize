from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item
from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate
from features.promos.crud import create_promo
from features.promos.schemas import PromoCreate
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.staff.crud import create_staff_profile, get_staff_profile_by_user_id
from features.users.models import User
from features.vendors.crud import create_vendor_profile, get_vendor_by_user_id
from features.vendors.models import VendorProfile
from features.vendors.schemas import VendorCreate
from seed.common import get_or_load_user
from seed.data import (
    DELETED_ITEM,
    PAUSED_RESTAURANT_ADDRESS,
    SEED_RESTAURANTS,
    SEED_USERS,
    UNAVAILABLE_ITEM_NAMES,
)
from seed.menu import create_sample_option_groups
from shared.permissions import CUSTOMER_PERMISSIONS, VENDOR_PERMISSIONS, permissions_with


async def _ensure_vendor(session: AsyncSession, user: User, name: str) -> VendorProfile:
    user.permissions = permissions_with(
        user.permissions, CUSTOMER_PERMISSIONS | VENDOR_PERMISSIONS
    )
    await session.commit()

    vendor = await get_vendor_by_user_id(session, user.id)
    if vendor is None:
        vendor = await create_vendor_profile(session, user, VendorCreate())
        vendor.approval_status = "APPROVED"
        await session.commit()
        print(f"  vendor profile → {name}")

    if vendor is not None and (
        vendor.approval_status != "APPROVED" or vendor.rejection_reason is not None
    ):
        vendor.approval_status = "APPROVED"
        vendor.rejection_reason = None
        await session.commit()
    return vendor


async def _create_restaurant_menu(
    session: AsyncSession, restaurant: Restaurant, rd: dict[str, Any]
) -> list[MenuItem]:
    items: list[MenuItem] = []
    for item in rd["items"]:
        mi = await create_menu_item(
            session,
            MenuItemCreate(
                name=item["name"],
                description=item.get("description"),
                price=item["price"],
                category=item["category"],
                prep_time_minutes=item["prep_time_minutes"],
            ),
            restaurant.id,
        )
        await create_sample_option_groups(session, mi)
        items.append(mi)
    await session.commit()
    print(f"    {len(items)} menu items")
    return items


async def _create_restaurant_promos(
    session: AsyncSession, restaurant: Restaurant, rd: dict[str, Any]
) -> None:
    for promo_data in rd.get("promos", []):
        await create_promo(
            session,
            PromoCreate(
                code=promo_data["code"],
                discount_type=promo_data["discount_type"],
                discount_value=promo_data["discount_value"],
                restaurant_id=restaurant.id,
                max_uses=promo_data.get("max_uses"),
            ),
        )
    if rd.get("promos"):
        print(f"    {len(rd['promos'])} promo codes")


async def _load_existing_items(
    session: AsyncSession, restaurant: Restaurant
) -> list[MenuItem]:
    result = await session.execute(
        select(MenuItem).where(
            MenuItem.restaurant_id == restaurant.id,
            MenuItem.is_deleted.is_(False),
        )
    )
    return list(result.scalars().all())


async def _apply_menu_flags(
    session: AsyncSession, restaurant: Restaurant, rd: dict[str, Any]
) -> None:
    result = await session.execute(
        select(MenuItem).where(MenuItem.restaurant_id == restaurant.id)
    )
    all_items = list(result.scalars().all())
    names = {mi.name for mi in all_items}

    for mi in all_items:
        if mi.name in UNAVAILABLE_ITEM_NAMES and mi.is_available:
            mi.is_available = False

    if rd.get("with_deleted_item") and DELETED_ITEM["name"] not in names:
        deleted = await create_menu_item(
            session,
            MenuItemCreate(
                name=DELETED_ITEM["name"],
                description=DELETED_ITEM["description"],
                price=DELETED_ITEM["price"],
                category=DELETED_ITEM["category"],
                prep_time_minutes=DELETED_ITEM["prep_time_minutes"],
            ),
            restaurant.id,
        )
        deleted.is_deleted = True
    await session.commit()


async def _apply_restaurant_state(
    session: AsyncSession, restaurant: Restaurant, rd: dict[str, Any]
) -> None:
    restaurant.moderation_status = "APPROVED"
    restaurant.rejection_reason = None
    restaurant.description = rd["description"]
    restaurant.is_hiring = rd.get("is_hiring", True)
    restaurant.is_ordering_paused = restaurant.address == PAUSED_RESTAURANT_ADDRESS
    restaurant.ordering_paused_until = None
    restaurant.avg_prep_time_minutes = rd.get("avg_prep_time_minutes", 15)
    restaurant.max_active_orders = rd.get("max_active_orders")
    await session.commit()
    await _apply_menu_flags(session, restaurant, rd)


async def _seed_restaurant(
    session: AsyncSession,
    vendor: VendorProfile,
    rd: dict[str, Any],
    restaurant_items: dict[str, list[MenuItem]],
) -> Restaurant:
    result = await session.execute(
        select(Restaurant).where(Restaurant.address == rd["address"])
    )
    restaurant = result.scalar_one_or_none()

    if restaurant is None:
        restaurant = await create_restaurant(
            session,
            RestaurantCreate(
                name=rd["name"],
                address=rd["address"],
                avg_prep_time_minutes=rd.get("avg_prep_time_minutes", 15),
                max_active_orders=rd.get("max_active_orders"),
            ),
            vendor.id,
        )
        restaurant.moderation_status = "APPROVED"
        restaurant.description = rd["description"]
        restaurant.is_hiring = rd.get("is_hiring", True)
        await session.commit()
        print(f"  restaurant '{rd['name']}'")

        items = await _create_restaurant_menu(session, restaurant, rd)
        restaurant_items[str(restaurant.id)] = items
        await _create_restaurant_promos(session, restaurant, rd)
    else:
        print(f"  skip restaurant '{rd['name']}' (exists)")
        restaurant_items[str(restaurant.id)] = await _load_existing_items(
            session, restaurant
        )

    await _apply_restaurant_state(session, restaurant, rd)
    return restaurant


async def seed_vendors_and_restaurants(
    session: AsyncSession, created_users: dict[str, User]
) -> tuple[list[Restaurant], dict[str, list[MenuItem]]]:
    print("\n── Vendors & Restaurants ───────────────")
    vendor_users = [u for u in SEED_USERS if u["role"] == "vendor"]
    all_restaurants: list[Restaurant] = []
    restaurant_items: dict[str, list[MenuItem]] = {}

    for i, vu in enumerate(vendor_users):
        user = await get_or_load_user(session, vu["phone_number"], created_users)
        if not user:
            continue

        vendor = await _ensure_vendor(session, user, vu["name"])

        for rd in SEED_RESTAURANTS:
            if rd["vendor_index"] != i:
                continue
            restaurant = await _seed_restaurant(session, vendor, rd, restaurant_items)
            all_restaurants.append(restaurant)

    return all_restaurants, restaurant_items


async def seed_staff(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
) -> None:
    print("\n── Staff ───────────────────────────────")
    staff_data = next((u for u in SEED_USERS if u["role"] == "staff"), None)
    if not (staff_data and all_restaurants):
        return
    staff_user = await get_or_load_user(
        session, staff_data["phone_number"], created_users
    )
    if not staff_user:
        return
    existing_profile = await get_staff_profile_by_user_id(session, staff_user.id)
    if existing_profile is None:
        await create_staff_profile(session, staff_user.id, all_restaurants[0].id)
        print(f"  {staff_data['name']} → '{all_restaurants[0].name}'")
    else:
        print("  skip (exists)")


async def seed_superuser(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
) -> None:
    superuser_data = next((u for u in SEED_USERS if u["role"] == "superuser"), None)
    if not (superuser_data and all_restaurants):
        return
    su = await get_or_load_user(
        session, superuser_data["phone_number"], created_users
    )
    if not su:
        return
    su.permissions = permissions_with(
        su.permissions, CUSTOMER_PERMISSIONS | VENDOR_PERMISSIONS
    )
    await session.commit()

    vendor = await get_vendor_by_user_id(session, su.id)
    if vendor is None:
        vendor = await create_vendor_profile(session, su, VendorCreate())
        vendor.approval_status = "APPROVED"
        await session.commit()
        print("  superuser vendor profile created")

    assigned_restaurant = all_restaurants[0]
    if assigned_restaurant.vendor_id != vendor.id:
        assigned_restaurant.vendor_id = vendor.id
        await session.commit()
        print(f"  superuser assigned as vendor for '{assigned_restaurant.name}'")

    existing_staff = await get_staff_profile_by_user_id(session, su.id)
    if existing_staff is None:
        await create_staff_profile(session, su.id, assigned_restaurant.id)
        print(f"  superuser staff profile → '{assigned_restaurant.name}'")
