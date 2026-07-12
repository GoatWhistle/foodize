import uuid
from datetime import UTC, datetime
from datetime import time as dt_time

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.working_hours import WorkingHours
from features.restaurants.working_hours_schemas import WorkingHoursEntry

_MIDNIGHT = dt_time(0, 0)


def _parse_time(value: str) -> dt_time:
    hour, minute = value.split(":")
    return dt_time(int(hour), int(minute))


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
    delete_stmt = delete(WorkingHours).where(WorkingHours.restaurant_id == restaurant_id)
    if incoming_days:
        delete_stmt = delete_stmt.where(WorkingHours.day_of_week.notin_(incoming_days))
    await session.execute(delete_stmt)
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
    await session.flush()
    return await get_working_hours(session, restaurant_id)


def is_open_now(hours: list[WorkingHours], now: datetime | None = None) -> bool | None:
    if not hours:
        return None
    if now is None:
        now = datetime.now(tz=UTC)
    dow = now.weekday()
    current_time = now.time().replace(tzinfo=None)
    for h in hours:
        if h.day_of_week == dow:
            if h.is_closed:
                return False
            open_t = _parse_time(h.open_time)
            close_t = _parse_time(h.close_time)
            if close_t == _MIDNIGHT:
                return current_time >= open_t
            if open_t < close_t:
                return open_t <= current_time < close_t
            return current_time >= open_t or current_time < close_t
    return None
