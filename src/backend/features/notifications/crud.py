import uuid
from datetime import datetime
from typing import Any, cast

from sqlalchemy import CursorResult, delete, func, select, tuple_, update
from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.models import Notification, NotificationType


async def create_notification(
    session: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    title_key: str | None = None,
    message_key: str | None = None,
    params: dict[str, object] | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        title_key=title_key,
        message_key=message_key,
        params=params or {},
    )
    session.add(notification)
    await session.flush()
    await session.refresh(notification)
    return notification


async def get_user_notifications(
    session: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
    cursor_created_at: datetime | None = None,
    cursor_id: uuid.UUID | None = None,
) -> tuple[list[Notification], int]:
    query = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
    )
    if cursor_created_at is not None and cursor_id is not None:
        query = query.where(
            tuple_(Notification.created_at, Notification.id) < (cursor_created_at, cursor_id)
        )
    else:
        query = query.offset(offset)
    total_query = (
        select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
    )

    result = await session.execute(query)
    total_result = await session.execute(total_query)

    return list(result.scalars().all()), total_result.scalar_one()


async def get_unread_count(session: AsyncSession, user_id: uuid.UUID) -> int:
    query = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    )
    result = await session.execute(query)
    return result.scalar_one()


async def mark_as_read(
    session: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID
) -> Notification | None:
    query = select(Notification).where(
        Notification.id == notification_id, Notification.user_id == user_id
    )
    result = await session.execute(query)
    notification = result.scalar_one_or_none()

    if notification and not notification.is_read:
        notification.is_read = True
        await session.flush()
        await session.refresh(notification)

    return notification


async def mark_all_as_read(session: AsyncSession, user_id: uuid.UUID) -> None:
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await session.execute(stmt)
    await session.flush()


async def delete_notification(
    session: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    stmt = delete(Notification).where(
        Notification.id == notification_id, Notification.user_id == user_id
    )
    result = cast("CursorResult[Any]", await session.execute(stmt))
    await session.flush()
    return result.rowcount > 0


async def delete_all_notifications(session: AsyncSession, user_id: uuid.UUID) -> None:
    stmt = delete(Notification).where(Notification.user_id == user_id)
    await session.execute(stmt)
    await session.flush()
