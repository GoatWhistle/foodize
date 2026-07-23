import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.loyalty import crud as loyalty_crud
from features.loyalty import service as loyalty_service
from features.loyalty.exceptions import LoyaltyRewardNotAvailableException
from features.orders.crud.order import get_order_by_id
from features.orders.schemas.order import OrderCancelRequest
from features.orders.services.order import cancel_order
from shared.enums.loyalty import LoyaltyRewardStatus, LoyaltyRewardType

from .loyalty_helpers import (
    complete_loyalty_order,
    place_loyalty_order,
    punch_upsert,
    seed_loyalty,
)


async def test_punch_card_issues_reward_and_redeems_it(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(db_session, restaurant.id, punch_upsert(), [restaurant.id])

    for _ in range(2):
        order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
        await complete_loyalty_order(db_session, order_id, vendor_user)

    account = await loyalty_crud.get_account(db_session, customer.id, restaurant.id)
    assert account is not None
    assert account.punches_count == 0
    assert account.orders_count == 2
    rewards = await loyalty_crud.get_available_rewards(db_session, account.id)
    assert len(rewards) == 1

    order_id = await place_loyalty_order(
        db_session, restaurant, menu_item, customer.id, loyalty_reward_id=rewards[0].id
    )
    order = await get_order_by_id(db_session, order_id)
    assert order is not None
    assert order.total_price == 200

    with pytest.raises(LoyaltyRewardNotAvailableException):
        await place_loyalty_order(
            db_session, restaurant, menu_item, customer.id, loyalty_reward_id=rewards[0].id
        )

    await cancel_order(db_session, order_id, customer.id, OrderCancelRequest())
    rewards = await loyalty_crud.get_available_rewards(db_session, account.id)
    assert len(rewards) == 1
    assert rewards[0].status == LoyaltyRewardStatus.AVAILABLE.value


async def test_punch_card_free_item_reward(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session,
        restaurant.id,
        punch_upsert(
            reward_type=LoyaltyRewardType.FREE_ITEM,
            reward_value=None,
            reward_menu_item_id=menu_item.id,
        ),
        [restaurant.id],
    )

    for _ in range(2):
        order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
        await complete_loyalty_order(db_session, order_id, vendor_user)

    account = await loyalty_crud.get_account(db_session, customer.id, restaurant.id)
    assert account is not None
    rewards = await loyalty_crud.get_available_rewards(db_session, account.id)
    assert len(rewards) == 1

    order_id = await place_loyalty_order(
        db_session, restaurant, menu_item, customer.id, loyalty_reward_id=rewards[0].id
    )
    order = await get_order_by_id(db_session, order_id)
    assert order is not None
    assert order.total_price == 0


async def test_punch_card_min_order_amount_skips_punch(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session, restaurant.id, punch_upsert(min_order_amount=500), [restaurant.id]
    )

    order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
    await complete_loyalty_order(db_session, order_id, vendor_user)

    account = await loyalty_crud.get_account(db_session, customer.id, restaurant.id)
    assert account is not None
    assert account.punches_count == 0
    assert account.orders_count == 1
