from sqlalchemy.ext.asyncio import AsyncSession

from features.loyalty import crud as loyalty_crud
from features.loyalty import service as loyalty_service
from shared.enums.loyalty import LoyaltyProgramType

from .loyalty_helpers import (
    cashback_upsert,
    complete_loyalty_order,
    place_loyalty_order,
    punch_upsert,
    seed_loyalty,
)


async def test_status_reports_tiers_and_rewards(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session, restaurant.id, cashback_upsert(), [restaurant.id]
    )

    status = await loyalty_service.get_status(db_session, restaurant.id, customer.id)
    assert status.program is not None
    assert status.points_balance == 0
    assert status.current_tier is not None
    assert status.current_tier.name == "Base"
    assert status.next_tier is not None
    assert status.next_tier.name == "Fan"

    for _ in range(2):
        order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
        await complete_loyalty_order(db_session, order_id, vendor_user)

    status = await loyalty_service.get_status(db_session, restaurant.id, customer.id)
    assert status.current_tier is not None
    assert status.current_tier.name == "Fan"
    assert status.next_tier is None
    assert status.points_balance == 45


async def test_switching_program_type_keeps_balances(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await seed_loyalty(db_session)
    await loyalty_service.upsert_program(
        db_session, restaurant.id, cashback_upsert(), [restaurant.id]
    )
    order_id = await place_loyalty_order(db_session, restaurant, menu_item, customer.id)
    await complete_loyalty_order(db_session, order_id, vendor_user)

    program = await loyalty_service.upsert_program(
        db_session, restaurant.id, punch_upsert(), [restaurant.id]
    )
    assert program.type == LoyaltyProgramType.PUNCH_CARD
    assert program.tiers == []

    account = await loyalty_crud.get_account(db_session, customer.id, restaurant.id)
    assert account is not None
    assert account.points_balance == 15
