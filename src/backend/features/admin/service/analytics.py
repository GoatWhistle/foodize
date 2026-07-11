import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.schemas import (
    AdvancedAnalytics,
    FinanceAnalytics,
    PlatformStats,
)


async def get_stats(session: AsyncSession) -> PlatformStats:
    return await crud.get_platform_stats(session)


async def get_finance(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
) -> FinanceAnalytics:
    return await crud.get_finance_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor_id,
        restaurant_id=restaurant_id,
    )


async def get_advanced_analytics(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
) -> AdvancedAnalytics:
    return await crud.get_advanced_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor_id,
        restaurant_id=restaurant_id,
    )
