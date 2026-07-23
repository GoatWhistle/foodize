import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from features.loyalty import crud
from features.loyalty.exceptions import (
    LoyaltyPointsInsufficientException,
    LoyaltyProgramInactiveException,
    LoyaltyProgramTypeMismatchException,
    LoyaltyRedeemLimitExceededException,
    LoyaltyRewardItemMissingException,
    LoyaltyRewardNotAvailableException,
    LoyaltyRewardNotFoundException,
)
from features.loyalty.models import LoyaltyAccount, LoyaltyProgram, LoyaltyTier
from features.menu.models import MenuItem
from features.orders.models import Order
from shared.enums.loyalty import (
    LoyaltyProgramType,
    LoyaltyRewardStatus,
    LoyaltyRewardType,
    LoyaltyTierBasis,
    LoyaltyTransactionType,
)


def basis_value(account: LoyaltyAccount | None, tier_basis: str) -> int:
    if account is None:
        return 0
    if tier_basis == LoyaltyTierBasis.SPENT.value:
        return account.total_spent
    return account.orders_count


def current_and_next_tier(
    tiers: Sequence[LoyaltyTier], value: int
) -> tuple[LoyaltyTier | None, LoyaltyTier | None]:
    ordered = sorted(tiers, key=lambda tier: tier.threshold)
    current: LoyaltyTier | None = None
    upcoming: LoyaltyTier | None = None
    for tier in ordered:
        if tier.threshold <= value:
            current = tier
        elif upcoming is None:
            upcoming = tier
    return current, upcoming


def _cashback_percent(program: LoyaltyProgram, account: LoyaltyAccount) -> int:
    value = basis_value(account, program.tier_basis)
    current, _ = current_and_next_tier(program.tiers, value)
    return current.cashback_percent if current else 0


async def _redeem_reward(
    session: AsyncSession,
    order: Order,
    reward_id: uuid.UUID,
    user_id: uuid.UUID,
    menu_items: dict[uuid.UUID, MenuItem],
) -> None:
    reward = await crud.get_reward_by_id_for_update(session, reward_id)
    account = await crud.get_account(session, user_id, order.restaurant_id)
    if reward is None or account is None or reward.account_id != account.id:
        raise LoyaltyRewardNotFoundException()
    if reward.status != LoyaltyRewardStatus.AVAILABLE.value:
        raise LoyaltyRewardNotAvailableException()

    if reward.reward_type == LoyaltyRewardType.FREE_ITEM.value:
        menu_item = (
            menu_items.get(reward.reward_menu_item_id) if reward.reward_menu_item_id else None
        )
        if menu_item is None:
            raise LoyaltyRewardItemMissingException()
        discount = menu_item.price
    elif reward.reward_type == LoyaltyRewardType.DISCOUNT_PERCENT.value:
        discount = order.total_price * (reward.reward_value or 0) // 100
    else:
        discount = min(reward.reward_value or 0, order.total_price)

    order.total_price = max(0, order.total_price - discount)
    reward.status = LoyaltyRewardStatus.USED.value
    reward.used_order_id = order.id


async def _redeem_points(
    session: AsyncSession,
    order: Order,
    points: int,
    user_id: uuid.UUID,
    program: LoyaltyProgram,
) -> None:
    account = await crud.get_account_for_update(session, user_id, order.restaurant_id)
    if account is None or account.points_balance < points:
        raise LoyaltyPointsInsufficientException()
    cap = order.total_price * (program.max_redeem_percent or 100) // 100
    if points > cap:
        raise LoyaltyRedeemLimitExceededException()
    account.points_balance -= points
    await crud.create_transaction(
        session, account.id, order.id, LoyaltyTransactionType.REDEEM, points
    )
    order.total_price -= points


async def apply_redemption(
    session: AsyncSession,
    order: Order,
    user_id: uuid.UUID,
    menu_items: dict[uuid.UUID, MenuItem],
    redeem_points: int = 0,
    reward_id: uuid.UUID | None = None,
) -> None:
    if not redeem_points and reward_id is None:
        return
    program = await crud.get_program_by_restaurant(session, order.restaurant_id)
    if program is None or not program.is_active:
        raise LoyaltyProgramInactiveException()
    if reward_id is not None:
        if program.type != LoyaltyProgramType.PUNCH_CARD.value:
            raise LoyaltyProgramTypeMismatchException()
        await _redeem_reward(session, order, reward_id, user_id, menu_items)
    if redeem_points:
        if program.type != LoyaltyProgramType.CASHBACK.value:
            raise LoyaltyProgramTypeMismatchException()
        await _redeem_points(session, order, redeem_points, user_id, program)


async def accrue_for_order(session: AsyncSession, order: Order) -> None:
    program = await crud.get_program_by_restaurant(session, order.restaurant_id)
    if program is None or not program.is_active:
        return
    account = await crud.get_or_create_account_for_update(
        session, order.user_id, order.restaurant_id
    )
    account.orders_count += 1
    account.total_spent += order.total_price

    if program.type == LoyaltyProgramType.CASHBACK.value:
        percent = _cashback_percent(program, account)
        points = order.total_price * percent // 100
        if points > 0:
            account.points_balance += points
            await crud.create_transaction(
                session, account.id, order.id, LoyaltyTransactionType.EARN, points
            )
        return

    if program.type == LoyaltyProgramType.PUNCH_CARD.value and program.punches_required:
        if program.min_order_amount is not None and order.total_price < program.min_order_amount:
            return
        account.punches_count += 1
        if account.punches_count >= program.punches_required:
            account.punches_count -= program.punches_required
            await crud.create_reward(
                session,
                account.id,
                program.reward_type or LoyaltyRewardType.DISCOUNT_FIXED.value,
                program.reward_value,
                program.reward_menu_item_id,
            )


async def release_for_order(session: AsyncSession, order: Order) -> None:
    refunds = await crud.get_refund_transactions_by_order(session, order.id)
    if not refunds:
        for transaction in await crud.get_redeem_transactions_by_order(session, order.id):
            account = await crud.get_account_by_id_for_update(session, transaction.account_id)
            if account is None:
                continue
            account.points_balance += transaction.amount
            await crud.create_transaction(
                session,
                account.id,
                order.id,
                LoyaltyTransactionType.REFUND,
                transaction.amount,
            )
    for reward in await crud.get_rewards_used_by_order(session, order.id):
        reward.status = LoyaltyRewardStatus.AVAILABLE.value
        reward.used_order_id = None
