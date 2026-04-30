import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.admin.schemas import (
    AdminRestaurantResponse,
    AdminReviewResponse,
    FinanceAnalytics,
    FinanceSeriesPoint,
    FinanceTopItem,
    FinanceTopRestaurant,
    PlatformStats,
    StatsGrowthPoint,
)
from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from features.reviews.models import Review
from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


async def get_all_users(
    session: AsyncSession,
    role: UserRole | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
    if role is not None:
        stmt = stmt.where(User.user_role == role.value)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
        )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_all_users(
    session: AsyncSession,
    role: UserRole | None = None,
    search: str | None = None,
) -> int:
    stmt = select(func.count()).select_from(User)
    if role is not None:
        stmt = stmt.where(User.user_role == role.value)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
        )
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def deactivate_user(session: AsyncSession, user: User) -> User:
    user.is_active = False
    await session.commit()
    await session.refresh(user)
    return user


async def activate_user(session: AsyncSession, user: User) -> User:
    user.is_active = True
    await session.commit()
    await session.refresh(user)
    return user


async def get_all_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Order]:
    stmt = (
        select(Order)
        .join(User, User.id == Order.user_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.menu_item),
            selectinload(Order.items).selectinload(OrderItem.selected_options),
            selectinload(Order.user),
            selectinload(Order.restaurant),
        )
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    if restaurant_id is not None:
        stmt = stmt.where(Order.restaurant_id == restaurant_id)
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (Restaurant.name.ilike(pattern))
        )
    if date_from is not None:
        stmt = stmt.where(Order.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to is not None:
        stmt = stmt.where(
            Order.created_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time())
        )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_all_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> int:
    stmt = (
        select(func.count())
        .select_from(Order)
        .join(User, User.id == Order.user_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
    )
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    if restaurant_id is not None:
        stmt = stmt.where(Order.restaurant_id == restaurant_id)
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (Restaurant.name.ilike(pattern))
        )
    if date_from is not None:
        stmt = stmt.where(Order.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to is not None:
        stmt = stmt.where(
            Order.created_at < datetime.combine(date_to + timedelta(days=1), datetime.min.time())
        )
    result = await session.execute(stmt)
    return result.scalar_one()


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
        pattern = f"%{vendor_search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open == is_open)
    if moderation_status:
        stmt = stmt.where(Restaurant.moderation_status == moderation_status)
    if min_rating is not None:
        stmt = stmt.having(avg_rating >= min_rating)
    stmt = stmt.offset(offset).limit(limit)
    result = await session.execute(stmt)
    return [
        AdminRestaurantResponse(
            id=row[0].id,
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
    data = await get_all_restaurants(
        session=session,
        search=search,
        vendor_search=vendor_search,
        is_open=is_open,
        moderation_status=moderation_status,
        min_rating=min_rating,
        offset=0,
        limit=100000,
    )
    return len(data)


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


async def deactivate_restaurant(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> Restaurant | None:
    restaurant = await session.get(Restaurant, restaurant_id)
    if not restaurant:
        return None
    restaurant.is_active = False
    restaurant.is_open = False
    restaurant.is_hiring = False
    await session.commit()
    await session.refresh(restaurant)
    return restaurant


async def deactivate_vendor(session: AsyncSession, vendor: VendorProfile) -> VendorProfile:
    vendor.user.user_role = UserRole.CUSTOMER.value
    for restaurant in vendor.restaurants or []:
        restaurant.is_active = False
        restaurant.is_open = False
        restaurant.is_hiring = False
    await session.commit()
    await session.refresh(vendor)
    return vendor


async def set_vendor_moderation(
    session: AsyncSession,
    vendor: VendorProfile,
    status: str,
    reason: str | None = None,
) -> VendorProfile:
    vendor.approval_status = status
    vendor.rejection_reason = reason if status == "REJECTED" else None
    if status == "APPROVED":
        vendor.user.user_role = UserRole.VENDOR.value
    await session.commit()
    await session.refresh(vendor)
    return vendor


async def set_restaurant_moderation(
    session: AsyncSession,
    restaurant: Restaurant,
    status: str,
    reason: str | None = None,
) -> Restaurant:
    restaurant.moderation_status = status
    restaurant.rejection_reason = reason if status == "REJECTED" else None
    await session.commit()
    await session.refresh(restaurant)
    return restaurant


async def get_all_reviews(
    session: AsyncSession,
    rating: int | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[AdminReviewResponse]:
    stmt = (
        select(
            Review,
            User.name.label("user_name"),
            User.phone_number.label("user_phone"),
            Restaurant.name.label("restaurant_name"),
        )
        .join(User, User.id == Review.user_id)
        .join(Restaurant, Restaurant.id == Review.restaurant_id)
        .where(Review.deleted_at.is_(None))
        .order_by(Review.created_at.desc())
    )
    if rating is not None:
        stmt = stmt.where(Review.rating == rating)
    stmt = stmt.offset(offset).limit(limit)
    result = await session.execute(stmt)
    return [
        AdminReviewResponse(
            id=row[0].id,
            user_id=row[0].user_id,
            user_name=row[1],
            user_phone=row[2],
            restaurant_id=row[0].restaurant_id,
            restaurant_name=row[3],
            rating=row[0].rating,
            text=row[0].text,
            is_verified_purchase=row[0].is_verified_purchase,
            created_at=row[0].created_at,
        )
        for row in result.all()
    ]


async def count_all_reviews(session: AsyncSession, rating: int | None = None) -> int:
    stmt = select(func.count()).select_from(Review).where(Review.deleted_at.is_(None))
    if rating is not None:
        stmt = stmt.where(Review.rating == rating)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_review_by_id(session: AsyncSession, review_id: uuid.UUID) -> Review | None:
    result = await session.execute(
        select(Review).where(Review.id == review_id, Review.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def delete_review(session: AsyncSession, review: Review) -> Review:
    import datetime

    review.deleted_at = datetime.datetime.now(datetime.timezone.utc)
    await session.commit()
    await session.refresh(review)
    return review


async def _count_by_day(
    session: AsyncSession,
    created_at_column,
    start_date: date,
) -> dict[date, int]:
    result = await session.execute(
        select(func.date(created_at_column), func.count())
        .where(created_at_column >= datetime.combine(start_date, datetime.min.time(), tzinfo=UTC))
        .group_by(func.date(created_at_column))
        .order_by(func.date(created_at_column))
    )
    counts: dict[date, int] = {}
    for day, count in result.all():
        if isinstance(day, str):
            day = date.fromisoformat(day)
        counts[day] = count
    return counts


def _growth_points(counts: dict[date, int], start_date: date, days: int) -> list[StatsGrowthPoint]:
    return [
        StatsGrowthPoint(
            date=start_date + timedelta(days=index),
            count=counts.get(start_date + timedelta(days=index), 0),
        )
        for index in range(days)
    ]


def _finance_points(
    counts: dict[date, int], start_date: date, days: int
) -> list[FinanceSeriesPoint]:
    return [
        FinanceSeriesPoint(
            date=start_date + timedelta(days=index),
            value=counts.get(start_date + timedelta(days=index), 0),
        )
        for index in range(days)
    ]


async def get_finance_analytics(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
) -> FinanceAnalytics:
    end_date = date_to or datetime.now(UTC).date()
    start_date = date_from or (end_date - timedelta(days=13))

    order_filters = [
        Order.created_at >= datetime.combine(start_date, datetime.min.time(), tzinfo=UTC),
        Order.created_at
        < datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=UTC),
    ]
    if vendor_id is not None:
        order_filters.append(Restaurant.vendor_id == vendor_id)

    revenue_rows = await session.execute(
        select(func.date(Order.created_at), func.coalesce(func.sum(Order.total_price), 0))
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*order_filters, Order.status == OrderStatus.COMPLETED.value)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    revenue_counts: dict[date, int] = {}
    for day, value in revenue_rows.all():
        if isinstance(day, str):
            day = date.fromisoformat(day)
        revenue_counts[day] = int(value or 0)

    totals = await session.execute(
        select(
            func.count(Order.id),
            func.count().filter(Order.status == OrderStatus.COMPLETED.value),
            func.count().filter(Order.status == OrderStatus.CANCELLED.value),
            func.coalesce(
                func.avg(Order.total_price).filter(Order.status == OrderStatus.COMPLETED.value), 0
            ),
        )
        .select_from(Order)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*order_filters)
    )
    total_orders, completed_orders, cancelled_orders, average_check = totals.one()

    top_restaurant_rows = await session.execute(
        select(
            Restaurant.id,
            Restaurant.name,
            func.coalesce(func.sum(Order.total_price), 0).label("revenue"),
            func.count(Order.id).label("orders_count"),
        )
        .join(Order, Order.restaurant_id == Restaurant.id)
        .where(*order_filters, Order.status == OrderStatus.COMPLETED.value)
        .group_by(Restaurant.id, Restaurant.name)
        .order_by(func.coalesce(func.sum(Order.total_price), 0).desc())
        .limit(5)
    )

    top_item_rows = await session.execute(
        select(
            MenuItem.id,
            MenuItem.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("quantity"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.price_at_purchase), 0).label(
                "revenue"
            ),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*order_filters, Order.status == OrderStatus.COMPLETED.value)
        .group_by(MenuItem.id, MenuItem.name)
        .order_by(func.coalesce(func.sum(OrderItem.quantity), 0).desc())
        .limit(5)
    )

    conversion = round((completed_orders / total_orders) * 100, 1) if total_orders else 0.0
    days = (end_date - start_date).days + 1
    return FinanceAnalytics(
        revenue_by_day=_finance_points(revenue_counts, start_date, days),
        average_check=round(float(average_check or 0), 1),
        top_restaurants=[
            FinanceTopRestaurant(
                restaurant_id=row[0],
                name=row[1],
                revenue=int(row[2] or 0),
                orders_count=row[3],
            )
            for row in top_restaurant_rows.all()
        ],
        top_items=[
            FinanceTopItem(
                menu_item_id=row[0],
                name=row[1],
                quantity=int(row[2] or 0),
                revenue=int(row[3] or 0),
            )
            for row in top_item_rows.all()
        ],
        cancelled_orders=cancelled_orders,
        total_orders=total_orders,
        completed_orders=completed_orders,
        conversion_percent=conversion,
    )


async def get_platform_stats(session: AsyncSession) -> PlatformStats:
    users_by_role_rows = await session.execute(
        select(User.user_role, func.count()).group_by(User.user_role)
    )
    users_by_role = {row[0]: row[1] for row in users_by_role_rows.all()}

    orders_by_status_rows = await session.execute(
        select(Order.status, func.count()).group_by(Order.status)
    )
    orders_by_status = {row[0]: row[1] for row in orders_by_status_rows.all()}

    total_restaurants_result = await session.execute(
        select(func.count()).select_from(Restaurant).where(Restaurant.is_active.is_(True))
    )
    total_restaurants = total_restaurants_result.scalar_one()

    total_vendors_result = await session.execute(
        select(func.count())
        .select_from(VendorProfile)
        .join(User, User.id == VendorProfile.user_id)
        .where(User.user_role == UserRole.VENDOR.value)
    )
    total_vendors = total_vendors_result.scalar_one()

    days = 14
    start_date = datetime.now(UTC).date() - timedelta(days=days - 1)
    users_growth = await _count_by_day(session, User.created_at, start_date)
    restaurants_growth = await _count_by_day(session, Restaurant.created_at, start_date)
    orders_growth = await _count_by_day(session, Order.created_at, start_date)
    vendors_growth = await _count_by_day(session, VendorProfile.created_at, start_date)

    return PlatformStats(
        users_by_role=users_by_role,
        orders_by_status=orders_by_status,
        total_restaurants=total_restaurants,
        total_vendors=total_vendors,
        growth={
            "users": _growth_points(users_growth, start_date, days),
            "restaurants": _growth_points(restaurants_growth, start_date, days),
            "orders": _growth_points(orders_growth, start_date, days),
            "vendors": _growth_points(vendors_growth, start_date, days),
        },
    )
