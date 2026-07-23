import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.loyalty.models import (
    LoyaltyAccount,
    LoyaltyProgram,
    LoyaltyReward,
    LoyaltyTransaction,
)
from features.restaurants.models import Restaurant
from shared.enums.loyalty import LoyaltyRewardStatus, LoyaltyTransactionType


async def get_restaurant_ids_by_vendor(
    session: AsyncSession, vendor_id: uuid.UUID
) -> list[uuid.UUID]:
    result = await session.execute(select(Restaurant.id).where(Restaurant.vendor_id == vendor_id))
    return [row[0] for row in result.fetchall()]


async def get_program_by_restaurant(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> LoyaltyProgram | None:
    result = await session.execute(
        select(LoyaltyProgram)
        .where(LoyaltyProgram.restaurant_id == restaurant_id)
        .options(selectinload(LoyaltyProgram.tiers))
    )
    return result.scalar_one_or_none()


async def get_account(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> LoyaltyAccount | None:
    result = await session.execute(
        select(LoyaltyAccount).where(
            LoyaltyAccount.user_id == user_id,
            LoyaltyAccount.restaurant_id == restaurant_id,
        )
    )
    return result.scalar_one_or_none()


async def get_account_for_update(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> LoyaltyAccount | None:
    result = await session.execute(
        select(LoyaltyAccount)
        .where(
            LoyaltyAccount.user_id == user_id,
            LoyaltyAccount.restaurant_id == restaurant_id,
        )
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def get_account_by_id_for_update(
    session: AsyncSession, account_id: uuid.UUID
) -> LoyaltyAccount | None:
    result = await session.execute(
        select(LoyaltyAccount).where(LoyaltyAccount.id == account_id).with_for_update()
    )
    return result.scalar_one_or_none()


async def get_or_create_account_for_update(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> LoyaltyAccount:
    account = await get_account_for_update(session, user_id, restaurant_id)
    if account is not None:
        return account
    account = LoyaltyAccount(user_id=user_id, restaurant_id=restaurant_id)
    session.add(account)
    await session.flush()
    return account


async def create_transaction(
    session: AsyncSession,
    account_id: uuid.UUID,
    order_id: uuid.UUID | None,
    type: LoyaltyTransactionType,
    amount: int,
) -> LoyaltyTransaction:
    transaction = LoyaltyTransaction(
        account_id=account_id, order_id=order_id, type=type.value, amount=amount
    )
    session.add(transaction)
    await session.flush()
    return transaction


async def get_redeem_transactions_by_order(
    session: AsyncSession, order_id: uuid.UUID
) -> list[LoyaltyTransaction]:
    result = await session.execute(
        select(LoyaltyTransaction).where(
            LoyaltyTransaction.order_id == order_id,
            LoyaltyTransaction.type == LoyaltyTransactionType.REDEEM.value,
        )
    )
    return list(result.scalars().all())


async def get_refund_transactions_by_order(
    session: AsyncSession, order_id: uuid.UUID
) -> list[LoyaltyTransaction]:
    result = await session.execute(
        select(LoyaltyTransaction).where(
            LoyaltyTransaction.order_id == order_id,
            LoyaltyTransaction.type == LoyaltyTransactionType.REFUND.value,
        )
    )
    return list(result.scalars().all())


async def create_reward(
    session: AsyncSession,
    account_id: uuid.UUID,
    reward_type: str,
    reward_value: int | None,
    reward_menu_item_id: uuid.UUID | None,
) -> LoyaltyReward:
    reward = LoyaltyReward(
        account_id=account_id,
        reward_type=reward_type,
        reward_value=reward_value,
        reward_menu_item_id=reward_menu_item_id,
    )
    session.add(reward)
    await session.flush()
    return reward


async def get_reward_by_id_for_update(
    session: AsyncSession, reward_id: uuid.UUID
) -> LoyaltyReward | None:
    result = await session.execute(
        select(LoyaltyReward).where(LoyaltyReward.id == reward_id).with_for_update()
    )
    return result.scalar_one_or_none()


async def get_available_rewards(
    session: AsyncSession, account_id: uuid.UUID
) -> list[LoyaltyReward]:
    result = await session.execute(
        select(LoyaltyReward)
        .where(
            LoyaltyReward.account_id == account_id,
            LoyaltyReward.status == LoyaltyRewardStatus.AVAILABLE.value,
        )
        .order_by(LoyaltyReward.created_at)
    )
    return list(result.scalars().all())


async def get_rewards_used_by_order(
    session: AsyncSession, order_id: uuid.UUID
) -> list[LoyaltyReward]:
    result = await session.execute(
        select(LoyaltyReward)
        .where(
            LoyaltyReward.used_order_id == order_id,
            LoyaltyReward.status == LoyaltyRewardStatus.USED.value,
        )
        .with_for_update()
    )
    return list(result.scalars().all())
