import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.working_hours import WorkingHours
from features.restaurants.working_hours_schemas import WorkingHoursEntry


async def get_working_hours(session: AsyncSession, restaurant_id: uuid.UUID) -> list[WorkingHours]:
    result = await session.execute(
        select(WorkingHours)
        .where(WorkingHours.restaurant_id == restaurant_id)
        .order_by(WorkingHours.day_of_week)
    )
    return list(result.scalars().all())


async def set_working_hours(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    entries: list[WorkingHoursEntry],
) -> list[WorkingHours]:
    incoming_days = [e.day_of_week for e in entries]
    await session.execute(
        delete(WorkingHours).where(
            WorkingHours.restaurant_id == restaurant_id,
            WorkingHours.day_of_week.notin_(incoming_days) if incoming_days else True,
        )
    )
    for e in entries:
        stmt = (
            pg_insert(WorkingHours)
            .values(
                restaurant_id=restaurant_id,
                day_of_week=e.day_of_week,
                open_time=e.open_time,
                close_time=e.close_time,
                is_closed=e.is_closed,
            )
            .on_conflict_do_update(
                constraint="uq_working_hours_restaurant_day",
                set_={
                    "open_time": e.open_time,
                    "close_time": e.close_time,
                    "is_closed": e.is_closed,
                },
            )
        )
        await session.execute(stmt)
    await session.commit()
    return await get_working_hours(session, restaurant_id)


def is_open_now(hours: list[WorkingHours]) -> bool | None:
    if not hours:
        return None
    now = datetime.now(tz=timezone.utc)
    dow = now.weekday()
    current_time = now.strftime("%H:%M")
    for h in hours:
        if h.day_of_week == dow:
            if h.is_closed:
                return False
            return h.open_time <= current_time < h.close_time
    return None
