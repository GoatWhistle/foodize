import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.crud import create_notification
from features.notifications.models import Notification, NotificationType
from features.users.models import User
from seed.common import get_or_load_user
from seed.fixtures.engagement import NOTIFICATIONS
from seed.fixtures.users import SEED_USERS


async def _count_notifications(session: AsyncSession, user_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id)
    )
    return int(result.scalar_one())


async def _seed_for_user(session: AsyncSession, user: User) -> int:
    if await _count_notifications(session, user.id) > 0:
        return 0
    created = 0
    for notification_spec in NOTIFICATIONS:
        notification = await create_notification(
            session,
            user.id,
            title=notification_spec["title"],
            message=notification_spec["message"],
            type=NotificationType(notification_spec["type"]),
        )
        notification.is_read = notification_spec["is_read"]
        created += 1
    await session.commit()
    return created


async def seed_notifications(
    session: AsyncSession, created_users: dict[str, User]
) -> None:
    print("\n── Notifications ───────────────────────")
    target_roles = {"customer", "superuser"}
    for u in SEED_USERS:
        if u["role"] not in target_roles:
            continue
        user = await get_or_load_user(session, u["phone_number"], created_users)
        if user is None:
            continue
        added = await _seed_for_user(session, user)
        if added:
            print(f"  +{added} notifications → {user.name}")
        else:
            print(f"  skip (exists): {user.name}")
