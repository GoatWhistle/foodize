import uuid

from sqlalchemy import Row, ScalarSelect, Select, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.schemas import AdminRestaurantResponse
from features.orders.models import Order
from features.restaurants.models import Restaurant
from features.reviews.models import Review
from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.order_status import OrderStatus

_AdminRestaurantRow = Row[tuple[Restaurant, str, str, float, int, int]]
_AdminRestaurantSelect = Select[tuple[Restaurant, str, str, float, int, int]]

_AVG_RATING = func.coalesce(func.avg(Review.rating), 0)


def _completed_orders_count_subquery() -> ScalarSelect[int]:
    return (
        select(func.count(Order.id))
        .where(
            Order.restaurant_id == Restaurant.id,
            Order.status == OrderStatus.COMPLETED.value,
        )
        .correlate(Restaurant)
        .scalar_subquery()
    )


def _admin_restaurant_select() -> _AdminRestaurantSelect:
    return (
        select(
            Restaurant,
            User.name.label("vendor_name"),
            User.phone_number.label("vendor_phone"),
            _AVG_RATING.label("average_rating"),
            func.count(func.distinct(Review.id)).label("review_count"),
            _completed_orders_count_subquery().label("orders_count"),
        )
        .join(VendorProfile, VendorProfile.id == Restaurant.vendor_id)
        .join(User, User.id == VendorProfile.user_id)
        .outerjoin(
            Review,
            and_(Review.restaurant_id == Restaurant.id, Review.deleted_at.is_(None)),
        )
        .where(Restaurant.is_active.is_(True))
        .group_by(Restaurant.id, User.name, User.phone_number)
    )


def _apply_restaurant_filters[RowT: tuple[object, ...]](
    stmt: Select[RowT],
    search: str | None,
    vendor_search: str | None,
    is_open: bool | None,
    moderation_status: str | None,
    min_rating: float | None,
) -> Select[RowT]:
    if search:
        stmt = stmt.where(Restaurant.name.ilike(f"%{search}%"))
    if vendor_search:
        pattern = f"%{vendor_search}%"
        stmt = stmt.where((User.name.ilike(pattern)) | (User.phone_number.ilike(pattern)))
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open.is_(is_open))
    if moderation_status is not None:
        stmt = stmt.where(Restaurant.moderation_status == moderation_status)
    if min_rating is not None:
        stmt = stmt.having(min_rating <= _AVG_RATING)
    return stmt


def _row_to_admin_restaurant(row: _AdminRestaurantRow) -> AdminRestaurantResponse:
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
    stmt = _apply_restaurant_filters(
        _admin_restaurant_select().order_by(Restaurant.created_at.desc()),
        search,
        vendor_search,
        is_open,
        moderation_status,
        min_rating,
    )
    result = await session.execute(stmt.offset(offset).limit(limit))
    return [_row_to_admin_restaurant(row) for row in result.all()]


async def count_all_restaurants(
    session: AsyncSession,
    search: str | None = None,
    vendor_search: str | None = None,
    is_open: bool | None = None,
    moderation_status: str | None = None,
    min_rating: float | None = None,
) -> int:
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
    stmt = _apply_restaurant_filters(
        stmt, search, vendor_search, is_open, moderation_status, min_rating
    )
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await session.execute(count_stmt)
    return result.scalar_one()


async def get_restaurant_by_id(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> AdminRestaurantResponse | None:
    stmt = _admin_restaurant_select().where(Restaurant.id == restaurant_id)
    row = (await session.execute(stmt)).one_or_none()
    if not row:
        return None
    return _row_to_admin_restaurant(row)


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
