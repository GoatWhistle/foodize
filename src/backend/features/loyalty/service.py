import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log import service as audit_service
from features.loyalty import crud
from features.loyalty.exceptions import (
    LoyaltyProgramNotFoundException,
    LoyaltyRewardItemInvalidException,
)
from features.loyalty.models import LoyaltyProgram, LoyaltyTier
from features.loyalty.order_integration import basis_value, current_and_next_tier
from features.loyalty.schemas import (
    LoyaltyProgramResponse,
    LoyaltyProgramUpsert,
    LoyaltyRewardResponse,
    LoyaltyStatusResponse,
    LoyaltyTierResponse,
)
from features.menu.models import MenuItem
from features.restaurants.exceptions import RestaurantNotFoundException
from shared.enums.loyalty import LoyaltyProgramType


async def _validate_reward_menu_item(
    session: AsyncSession, restaurant_id: uuid.UUID, menu_item_id: uuid.UUID
) -> None:
    result = await session.execute(
        select(MenuItem.id).where(
            MenuItem.id == menu_item_id,
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.is_deleted.is_(False),
        )
    )
    if result.scalar_one_or_none() is None:
        raise LoyaltyRewardItemInvalidException()


async def get_vendor_program(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    vendor_restaurant_ids: list[uuid.UUID],
) -> LoyaltyProgramResponse:
    if restaurant_id not in vendor_restaurant_ids:
        raise RestaurantNotFoundException()
    program = await crud.get_program_by_restaurant(session, restaurant_id)
    if program is None:
        raise LoyaltyProgramNotFoundException()
    return LoyaltyProgramResponse.model_validate(program)


async def upsert_program(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    data: LoyaltyProgramUpsert,
    vendor_restaurant_ids: list[uuid.UUID],
    actor_id: uuid.UUID | None = None,
) -> LoyaltyProgramResponse:
    if restaurant_id not in vendor_restaurant_ids:
        raise RestaurantNotFoundException()
    if data.type == LoyaltyProgramType.PUNCH_CARD and data.reward_menu_item_id is not None:
        await _validate_reward_menu_item(session, restaurant_id, data.reward_menu_item_id)

    program = await crud.get_program_by_restaurant(session, restaurant_id)
    if program is None:
        program = LoyaltyProgram(restaurant_id=restaurant_id, type=data.type.value)
        session.add(program)

    program.type = data.type.value
    program.is_active = data.is_active
    program.tier_basis = data.tier_basis.value
    program.min_order_amount = data.min_order_amount
    program.punches_required = data.punches_required
    program.reward_type = data.reward_type.value if data.reward_type else None
    program.reward_value = data.reward_value
    program.reward_menu_item_id = data.reward_menu_item_id
    program.max_redeem_percent = data.max_redeem_percent
    tiers = data.tiers if data.type == LoyaltyProgramType.CASHBACK else []
    program.tiers = [
        LoyaltyTier(
            name=tier.name,
            threshold=tier.threshold,
            cashback_percent=tier.cashback_percent,
        )
        for tier in tiers
    ]

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="UPSERT_LOYALTY_PROGRAM",
        entity_type="loyalty_program",
        entity_id=program.id,
        details={
            "restaurant_id": str(restaurant_id),
            "type": program.type,
            "is_active": program.is_active,
        },
    )
    await session.flush()
    return LoyaltyProgramResponse.model_validate(program)


async def get_status(
    session: AsyncSession, restaurant_id: uuid.UUID, user_id: uuid.UUID
) -> LoyaltyStatusResponse:
    program = await crud.get_program_by_restaurant(session, restaurant_id)
    account = await crud.get_account(session, user_id, restaurant_id)
    rewards = await crud.get_available_rewards(session, account.id) if account else []

    active_program = program if program is not None and program.is_active else None
    current_tier: LoyaltyTier | None = None
    next_tier: LoyaltyTier | None = None
    if active_program is not None and active_program.type == LoyaltyProgramType.CASHBACK.value:
        value = basis_value(account, active_program.tier_basis)
        current_tier, next_tier = current_and_next_tier(active_program.tiers, value)

    return LoyaltyStatusResponse(
        program=(LoyaltyProgramResponse.model_validate(active_program) if active_program else None),
        points_balance=account.points_balance if account else 0,
        punches_count=account.punches_count if account else 0,
        orders_count=account.orders_count if account else 0,
        total_spent=account.total_spent if account else 0,
        current_tier=(LoyaltyTierResponse.model_validate(current_tier) if current_tier else None),
        next_tier=LoyaltyTierResponse.model_validate(next_tier) if next_tier else None,
        rewards=[LoyaltyRewardResponse.model_validate(reward) for reward in rewards],
    )
