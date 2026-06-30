import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.admin.schemas import AdminRestaurantResponse
from features.orders.models import Order
from features.restaurants.models import Restaurant
from features.reviews.models import Review
from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.permissions import VENDOR_PERMISSIONS, has_permission, permissions_with, permissions_without


async def get_all_restaurants(
    session: AsyncSession,
    search: str | None = None,
    vendor_search: str | None = None,
    is_open: bool | None = None,
    moderation_status: str | None = None,
    min_rating: float | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[AdminRestaurantResponse]:
    avg_rating = func.coalesce(func.avg(Review.rating), 0)
    stmt = (
        select(
            Restaurant,
            User.name.label("vendor_name"),
            User.phone_number.label("vendor_phone"),
            avg_rating.label("average_rating"),
            func.count(func.distinct(Review.id)).label("review_count"),
            func.count(func.distinct(Order.id)).label("orders_count"),
        )
        .join(VendorProfile, VendorProfile.id == Restaurant.vendor_id)
        .join(User, User.id == VendorProfile.user_id)
        .outerjoin(
            Review,
            and_(Review.restaurant_id == Restaurant.id, Review.deleted_at.is_(None)),
        )
        .outerjoin(Order, Order.restaurant_id == Restaurant.id)
        .where(Restaurant.is_active.is_(True))
        .group_by(Restaurant.id, User.name, User.phone_number)
        .order_by(Restaurant.created_at.desc())
    )
    if search:
        stmt = stmt.where(Restaurant.name.ilike(f"%{search}%"))
    if vendor_search:
        stmt = stmt.where(
            (User.name.ilike(f"%{vendor_search}%"))
            | (User.phone_number.ilike(f"%{vendor_search}%"))
        )
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open.is_(is_open))
    if moderation_status is not None:
        stmt = stmt.where(Restaurant.moderation_status == moderation_status)
    if min_rating is not None:
        stmt = stmt.having(avg_rating >= min_rating)
    result = await session.execute(stmt.offset(offset).limit(limit))
    return [
        AdminRestaurantResponse(
            id=row[0].id,
            display_id=row[0].display_id,
            name=row[0].name,
            address=row[0].address,
            vendor_id=row[0].vendor_id,
            vendor_name=row[1],
            vendor_phone=row[2],
            is_hiring=row[0].is_hiring,
            is_open=row[0].is_open,
            is_active=row[0].is_active,
            photo_url=row[0].photo_url,
            average_rating=round(float(row[3]), 1),
            review_count=row[4],
            orders_count=row[5],
            moderation_status=row[0].moderation_status,
            rejection_reason=row[0].rejection_reason,
            created_at=row[0].created_at,
        )
        for row in result.all()
    ]


async def count_all_restaurants(
    session: AsyncSession,
    search: str | None = None,
    vendor_search: str | None = None,
    is_open: bool | None = None,
    moderation_status: str | None = None,
    min_rating: float | None = None,
) -> int:
    avg_rating = func.coalesce(func.avg(Review.rating), 0)
    stmt = (
        select(Restaurant.id)
        .join(VendorProfile, VendorProfile.id == Restaurant.vendor_id)
        .join(User, User.id == VendorProfile.user_id)
        .outerjoin(
            Review,
            and_(Review.restaurant_id == Restaurant.id, Review.deleted_at.is_(None)),
        )
        .where(Restaurant.is_active.is_(True))
        .group_by(Restaurant.id, User.name, User.phone_number)
    )
    if search:
        stmt = stmt.where(Restaurant.name.ilike(f"%{search}%"))
    if vendor_search:
        pattern = f"%{vendor_search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open == is_open)
    if moderation_status is not None:
        stmt = stmt.where(Restaurant.moderation_status == moderation_status)
    if min_rating is not None:
        stmt = stmt.having(avg_rating >= min_rating)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await session.execute(count_stmt)
    return result.scalar_one()


async def get_restaurant_by_id(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> AdminRestaurantResponse | None:
    stmt = (
        select(
            Restaurant,
            User.name.label("vendor_name"),
            User.phone_number.label("vendor_phone"),
            func.coalesce(func.avg(Review.rating), 0).label("average_rating"),
            func.count(func.distinct(Review.id)).label("review_count"),
            func.count(func.distinct(Order.id)).label("orders_count"),
        )
        .join(VendorProfile, VendorProfile.id == Restaurant.vendor_id)
        .join(User, User.id == VendorProfile.user_id)
        .outerjoin(
            Review,
            and_(Review.restaurant_id == Restaurant.id, Review.deleted_at.is_(None)),
        )
        .outerjoin(Order, Order.restaurant_id == Restaurant.id)
        .where(Restaurant.id == restaurant_id, Restaurant.is_active.is_(True))
        .group_by(Restaurant.id, User.name, User.phone_number)
    )
    row = (await session.execute(stmt)).one_or_none()
    if not row:
        return None
    restaurant = row[0]
    return AdminRestaurantResponse(
        id=restaurant.id,
        display_id=restaurant.display_id,
        name=restaurant.name,
        address=restaurant.address,
        vendor_id=restaurant.vendor_id,
        vendor_name=row[1],
        vendor_phone=row[2],
        is_hiring=restaurant.is_hiring,
        is_open=restaurant.is_open,
        is_active=restaurant.is_active,
        photo_url=restaurant.photo_url,
        average_rating=round(float(row[3]), 1),
        review_count=row[4],
        orders_count=row[5],
        moderation_status=restaurant.moderation_status,
        rejection_reason=restaurant.rejection_reason,
        created_at=restaurant.created_at,
    )


async def deactivate_restaurant(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> Restaurant | None:
    restaurant = await session.get(Restaurant, restaurant_id)
    if not restaurant:
        return None
    restaurant.is_active = False
    restaurant.is_open = False
    restaurant.is_hiring = False
    await session.flush()
    await session.refresh(restaurant)
    return restaurant


async def set_restaurant_moderation(
    session: AsyncSession,
    restaurant: Restaurant,
    status: str,
    reason: str | None = None,
) -> Restaurant:
    restaurant.moderation_status = status
    restaurant.rejection_reason = reason if status == ModerationStatus.REJECTED.value else None
    await session.flush()
    await session.refresh(restaurant)
    return restaurant


async def get_all_vendors(
    session: AsyncSession,
    search: str | None = None,
    approval_status: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[VendorProfile]:
    stmt = (
        select(VendorProfile)
        .join(User, User.id == VendorProfile.user_id)
        .options(selectinload(VendorProfile.user), selectinload(VendorProfile.restaurants))
        .order_by(VendorProfile.created_at.desc())
    )
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if approval_status:
        stmt = stmt.where(VendorProfile.approval_status == approval_status)
    result = await session.execute(stmt.offset(offset).limit(limit))
    return list(result.scalars().all())


async def count_all_vendors(
    session: AsyncSession,
    search: str | None = None,
    approval_status: str | None = None,
) -> int:
    stmt = (
        select(func.count()).select_from(VendorProfile).join(User, User.id == VendorProfile.user_id)
    )
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if approval_status:
        stmt = stmt.where(VendorProfile.approval_status == approval_status)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_vendor_by_id(session: AsyncSession, vendor_id: uuid.UUID) -> VendorProfile | None:
    result = await session.execute(
        select(VendorProfile)
        .join(User, User.id == VendorProfile.user_id)
        .where(VendorProfile.id == vendor_id)
        .options(selectinload(VendorProfile.user), selectinload(VendorProfile.restaurants))
    )
    return result.scalar_one_or_none()


async def deactivate_vendor(session: AsyncSession, vendor: VendorProfile) -> VendorProfile:
    if not has_permission(vendor.user.permissions, Permission.ADMIN_ACCESS):
        vendor.user.permissions = permissions_without(vendor.user.permissions, VENDOR_PERMISSIONS)
    for restaurant in vendor.restaurants or []:
        restaurant.is_active = False
        restaurant.is_open = False
        restaurant.is_hiring = False
    await session.flush()
    await session.refresh(vendor)
    return vendor


async def set_vendor_moderation(
    session: AsyncSession,
    vendor: VendorProfile,
    status: str,
    reason: str | None = None,
) -> VendorProfile:
    vendor.approval_status = status
    vendor.rejection_reason = reason if status == ModerationStatus.REJECTED.value else None
    if status == ModerationStatus.APPROVED.value:
        if not has_permission(vendor.user.permissions, Permission.ADMIN_ACCESS):
            vendor.user.permissions = permissions_with(vendor.user.permissions, VENDOR_PERMISSIONS)
        for restaurant in vendor.restaurants or []:
            restaurant.moderation_status = ModerationStatus.APPROVED.value
            restaurant.rejection_reason = None
    await session.flush()
    await session.refresh(vendor)
    return vendor
