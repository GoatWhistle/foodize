import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features import MenuItem, Order, OrderItem
from features.orders.crud.order import get_order_by_id, get_orders_by_user_id
from features.orders.crud.order_item import get_menu_items_by_ids
from features.orders.exceptions import (
    MenuItemsNotFoundException,
    OrderAccessDeniedException,
    OrderNotFoundException,
)
from features.orders.schemas.order import OrderCreate


async def create_order_in_db(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    menu_items: dict[uuid.UUID, MenuItem],
) -> Order:
    total_price = sum(
        menu_items[item.menu_item_id].price * item.quantity for item in order_data.items
    )
    order = Order(
        user_id=user_id,
        restaurant_id=order_data.restaurant_id,
        total_price=total_price,
    )
    session.add(order)
    await session.flush()

    for item_data in order_data.items:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            price_at_purchase=menu_items[item_data.menu_item_id].price,
        )
        session.add(order_item)

    await session.commit()
    await session.refresh(order)
    return order


async def place_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
) -> Order:
    menu_item_ids = [item.menu_item_id for item in order_data.items]
    menu_items = await get_menu_items_by_ids(session, menu_item_ids)

    if len(menu_items) != len(menu_item_ids):
        raise MenuItemsNotFoundException()

    return await create_order_in_db(
        session=session,
        order_data=order_data,
        user_id=user_id,
        menu_items=menu_items,
    )


async def get_user_orders(session: AsyncSession, user_id: uuid.UUID) -> list[Order]:
    return await get_orders_by_user_id(session, user_id)


async def get_order_for_user(
    session: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Order:
    order = await get_order_by_id(session, order_id)

    if not order:
        raise OrderNotFoundException()

    if order.user_id != user_id:
        raise OrderAccessDeniedException()

    return order
