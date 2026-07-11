from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.orders.models import Order
from features.telegram._shared import find_or_create_telegram_user, normalize_username
from features.telegram.crud import get_telegram_id_by_user_id, get_user_by_telegram_id
from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.order_status import OrderStatus


async def link_phone_from_bot(
    session: AsyncSession,
    telegram_id: int,
    telegram_username: str | None,
    phone_number: str,
    name: str,
) -> User:
    return await find_or_create_telegram_user(
        session,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        phone_number=phone_number,
        name=name,
        check_username=False,
    )


async def register_from_bot(
    session: AsyncSession,
    telegram_id: int,
    telegram_username: str | None,
    name: str,
) -> User:
    normalized_username = normalize_username(telegram_username) if telegram_username else None
    return await find_or_create_telegram_user(
        session,
        telegram_id=telegram_id,
        telegram_username=normalized_username,
        phone_number=f"tg_{telegram_id}",
        name=name,
        check_username=True,
        update_username_on_tg_match=True,
    )


async def get_vendor_status_for_telegram_id(
    session: AsyncSession, telegram_id: int
) -> VendorProfile | None:
    user = await get_user_by_telegram_id(session, telegram_id)
    if not user:
        return None

    result = await session.execute(select(VendorProfile).where(VendorProfile.user_id == user.id))
    return result.scalar_one_or_none()


async def get_telegram_id_for_user_id(session: AsyncSession, user_id: str) -> int | None:
    return await get_telegram_id_by_user_id(session, user_id)


async def get_active_orders_for_telegram_id(
    session: AsyncSession, telegram_id: int, limit: int = 3
) -> list[Order]:
    user = await get_user_by_telegram_id(session, telegram_id)
    if not user:
        return []

    active_statuses = [
        OrderStatus.PENDING.value,
        OrderStatus.ACCEPTED.value,
        OrderStatus.READY.value,
    ]
    result = await session.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .where(Order.status.in_(active_statuses))
        .options(selectinload(Order.restaurant))
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
