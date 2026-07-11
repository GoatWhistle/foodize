from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import json_array_contains_string
from features.admin.schemas import PlatformStats, StatsGrowthPoint
from features.orders.models import Order
from features.restaurants.models import Restaurant
from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.enums.roles import UserRole
from shared.permissions import serialize_permissions


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


async def get_platform_stats(session: AsyncSession) -> PlatformStats:
    is_admin = json_array_contains_string(User.permissions, Permission.ADMIN_ACCESS.value)
    is_vendor = json_array_contains_string(User.permissions, Permission.RESTAURANTS_CREATE.value)
    is_staff = json_array_contains_string(User.permissions, Permission.ORDERS_MANAGE_STATUS.value)
    roles_row = await session.execute(
        select(
            func.count().filter(is_admin),
            func.count().filter(~is_admin & is_vendor),
            func.count().filter(~is_admin & ~is_vendor & is_staff),
            func.count().filter(~is_admin & ~is_vendor & ~is_staff),
        )
    )
    admins, vendors, staff, customers = roles_row.one()
    users_by_role: dict[str, int] = {
        UserRole.CUSTOMER.value: customers,
        UserRole.VENDOR.value: vendors,
        UserRole.STAFF.value: staff,
        UserRole.ADMIN.value: admins,
    }

    permission_counts = await session.execute(
        select(User.permissions).where(User.permissions.isnot(None))
    )
    users_by_permission: dict[str, int] = {}
    for permissions in permission_counts.scalars().all():
        for permission in set(serialize_permissions(permissions)):
            users_by_permission[permission] = users_by_permission.get(permission, 0) + 1

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
        .where(VendorProfile.approval_status == ModerationStatus.APPROVED.value)
    )
    total_vendors = total_vendors_result.scalar_one()

    days = 14
    start_date = datetime.now(UTC).date() - timedelta(days=days - 1)
    users_growth_result = await session.execute(
        select(func.date(User.created_at), func.count())
        .where(User.created_at >= datetime.combine(start_date, datetime.min.time(), tzinfo=UTC))
        .where(~json_array_contains_string(User.permissions, Permission.ADMIN_ACCESS.value))
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )
    users_growth: dict[date, int] = {}
    for day, count in users_growth_result.all():
        if isinstance(day, str):
            day = date.fromisoformat(day)
        users_growth[day] = count
    restaurants_growth = await _count_by_day(session, Restaurant.created_at, start_date)
    orders_growth = await _count_by_day(session, Order.created_at, start_date)
    vendors_growth = await _count_by_day(session, VendorProfile.created_at, start_date)

    return PlatformStats(
        users_by_permission=users_by_permission,
        users_by_role=users_by_role,
        total_users=users_by_role[UserRole.CUSTOMER.value]
        + users_by_role[UserRole.STAFF.value]
        + users_by_role[UserRole.VENDOR.value],
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
