import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.loyalty import crud as loyalty_crud
from features.loyalty import service as loyalty_service
from features.loyalty.exceptions import (
    LoyaltyPointsInsufficientException,
    LoyaltyProgramInactiveException,
    LoyaltyRedeemLimitExceededException,
)
from features.orders.crud.order import get_order_by_id
from features.orders.schemas.order import OrderCancelRequest
from features.orders.services.order import cancel_order

from .loyalty_helpers import (
    cashback_upsert,
    complete_loyalty_order,
    place_loyalty_order,
    seed_loyalty,
)


async def test_cashback_earns_by_tier_and_redeems(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session, restaurant.id, cashback_upsert(), [restaurant.id]
    )

    order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
    await complete_loyalty_order(db_session, order_id, vendor_user)
    account = await loyalty_crud.get_account(db_session, customer.id, restaurant.id)
    assert account is not None
    assert account.points_balance == 15

    order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
    await complete_loyalty_order(db_session, order_id, vendor_user)
    await db_session.refresh(account)
    assert account.points_balance == 45

    order_id = await place_loyalty_order(
        db_session, restaurant, menu_item, customer.id, redeem_points=45
    )
    order = await get_order_by_id(db_session, order_id)
    assert order is not None
    assert order.total_price == 255
    await db_session.refresh(account)
    assert account.points_balance == 0

    await cancel_order(db_session, order_id, customer.id, OrderCancelRequest())
    await db_session.refresh(account)
    assert account.points_balance == 45


async def test_cashback_redeem_errors(db_session: AsyncSession) -> None:
    _, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session, restaurant.id, cashback_upsert(), [restaurant.id]
    )

    with pytest.raises(LoyaltyPointsInsufficientException):
        await place_loyalty_order(db_session, restaurant, menu_item, customer.id, redeem_points=10)

    account = await loyalty_crud.get_or_create_account_for_update(
        db_session, customer.id, restaurant.id
    )
    account.points_balance = 1000
    await db_session.flush()

    with pytest.raises(LoyaltyRedeemLimitExceededException):
        await place_loyalty_order(db_session, restaurant, menu_item, customer.id, redeem_points=200)


async def test_inactive_program_blocks_redeem_and_accrual(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session, restaurant.id, cashback_upsert(is_active=False), [restaurant.id]
    )

    with pytest.raises(LoyaltyProgramInactiveException):
        await place_loyalty_order(db_session, restaurant, menu_item, customer.id, redeem_points=10)

    order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
    await complete_loyalty_order(db_session, order_id, vendor_user)
    account = await loyalty_crud.get_account(db_session, customer.id, restaurant.id)
    assert account is None
