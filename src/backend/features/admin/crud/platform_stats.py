from datetime import UTC, date, datetime, timedelta
from typing import cast

from sqlalchemy import ColumnElement, func, select, true, type_coerce
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from database import JSONB, json_array_contains_string
from features.admin.schemas import PlatformStats, StatsGrowthPoint
from features.orders.models import Order
from features.restaurants.models import Restaurant
from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.enums.roles import UserRole
from shared.permissions import serialize_permissions

_GROWTH_WINDOW_DAYS = 14


async def _count_by_day(
    session: AsyncSession,
    created_at_column: InstrumentedAttribute[datetime],
    start_date: date,
    *extra_filters: ColumnElement[bool],
) -> dict[date, int]:
    result = await session.execute(
        select(func.date(created_at_column), func.count())
        .where(created_at_column >= datetime.combine(start_date, datetime.min.time(), tzinfo=UTC))
        .where(*extra_filters)
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


async def _count_users_by_permission(session: AsyncSession) -> dict[str, int]:
    if session.bind is not None and session.bind.dialect.name == "postgresql":
        permission_element = func.jsonb_array_elements_text(
            type_coerce(User.permissions, JSONB)
        ).table_valued("value")
        rows = await session.execute(
            select(permission_element.c.value, func.count())
            .select_from(User)
            .join(permission_element, true())
            .where(User.permissions.isnot(None))
            .group_by(permission_element.c.value)
        )
        return dict(cast("list[tuple[str, int]]", rows.all()))

    result = await session.execute(select(User.permissions).where(User.permissions.isnot(None)))
    counts: dict[str, int] = {}
    for permissions in result.scalars().all():
        for permission in set(serialize_permissions(permissions)):
            counts[permission] = counts.get(permission, 0) + 1
    return counts


async def _count_users_by_role(session: AsyncSession) -> dict[str, int]:
    is_admin = json_array_contains_string(User.permissions, Permission.ADMIN_ACCESS.value)
    is_vendor = json_array_contains_string(User.permissions, Permission.RESTAURANTS_CREATE.value)
    is_staff = json_array_contains_string(User.permissions, Permission.ORDERS_MANAGE_STATUS.value)
    roles_row = await session.execute(
        select(
            func.count().filter(is_admin),
            func.count().filter(~is_admin & is_vendor),
            func.count().filter(~is_admin & ~is_vendor & is_staff),
            func.count().filter(~is_admin & ~is_vendor & ~is_staff),
        ).select_from(User)
    )
    admins, vendors, staff, customers = roles_row.one()
    return {
        UserRole.CUSTOMER.value: customers,
        UserRole.VENDOR.value: vendors,
        UserRole.STAFF.value: staff,
        UserRole.ADMIN.value: admins,
    }


async def _count_orders_by_status(session: AsyncSession) -> dict[str, int]:
    orders_by_status_rows = await session.execute(
        select(Order.status, func.count()).group_by(Order.status)
    )
    return {row[0]: row[1] for row in orders_by_status_rows.all()}


async def _growth_series(
    session: AsyncSession, start_date: date, days: int
) -> dict[str, list[StatsGrowthPoint]]:
    non_admin = ~json_array_contains_string(User.permissions, Permission.ADMIN_ACCESS.value)
    users_growth = await _count_by_day(session, User.created_at, start_date, non_admin)
    restaurants_growth = await _count_by_day(session, Restaurant.created_at, start_date)
    orders_growth = await _count_by_day(session, Order.created_at, start_date)
    vendors_growth = await _count_by_day(session, VendorProfile.created_at, start_date)
    return {
        "users": _growth_points(users_growth, start_date, days),
        "restaurants": _growth_points(restaurants_growth, start_date, days),
        "orders": _growth_points(orders_growth, start_date, days),
        "vendors": _growth_points(vendors_growth, start_date, days),
    }


async def get_platform_stats(session: AsyncSession) -> PlatformStats:
    users_by_role = await _count_users_by_role(session)
    users_by_permission = await _count_users_by_permission(session)
    orders_by_status = await _count_orders_by_status(session)

    total_restaurants_result = await session.execute(
        select(func.count()).select_from(Restaurant).where(Restaurant.is_active.is_(True))
    )
    total_restaurants = total_restaurants_result.scalar_one()

    total_vendors_result = await session.execute(
        select(func.count())
        .select_from(VendorProfile)
        .where(VendorProfile.approval_status == ModerationStatus.APPROVED.value)
    )
    total_vendors = total_vendors_result.scalar_one()

    start_date = datetime.now(UTC).date() - timedelta(days=_GROWTH_WINDOW_DAYS - 1)
    growth = await _growth_series(session, start_date, _GROWTH_WINDOW_DAYS)

    return PlatformStats(
        users_by_permission=users_by_permission,
        users_by_role=users_by_role,
        total_users=users_by_role[UserRole.CUSTOMER.value]
        + users_by_role[UserRole.STAFF.value]
        + users_by_role[UserRole.VENDOR.value],
        orders_by_status=orders_by_status,
        total_restaurants=total_restaurants,
        total_vendors=total_vendors,
        growth=growth,
    )
