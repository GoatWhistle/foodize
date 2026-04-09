import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from features.orders.crud import (
    create_order_in_db,
    get_menu_items_by_ids,
    get_order_by_id,
    get_orders_by_user_id,
)
from features.orders.models import Order
from features.orders.schemas import OrderCreate
async def place_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
) -> Order:
    menu_item_ids = [item.menu_item_id for item in order_data.items]
    menu_items = await get_menu_items_by_ids(session, menu_item_ids)
    if len(menu_items) != len(menu_item_ids):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="One or more menu items were not found.",
        )
    return await create_order_in_db(
        session=session,
        order_data=order_data,
        user_id=user_id,
        menu_items=menu_items,
    )
async def get_user_orders(
    session: AsyncSession, user_id: uuid.UUID
) -> list[Order]:
    return await get_orders_by_user_id(session, user_id)
async def get_order_for_user(
    session: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Order:
    order = await get_order_by_id(session, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )
    return order
