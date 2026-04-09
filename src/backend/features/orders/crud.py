import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.orders.schemas import OrderCreate
async def get_menu_items_by_ids(
    session: AsyncSession, ids: list[uuid.UUID]
) -> dict[uuid.UUID, MenuItem]:
    result = await session.execute(select(MenuItem).where(MenuItem.id.in_(ids)))
    return {mi.id: mi for mi in result.scalars().all()}
async def create_order_in_db(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    menu_items: dict[uuid.UUID, MenuItem],
) -> Order:
    total_price = sum(
        menu_items[item.menu_item_id].price * item.quantity
        for item in order_data.items
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
async def get_orders_by_user_id(
    session: AsyncSession, user_id: uuid.UUID
) -> list[Order]:
    result = await session.execute(select(Order).where(Order.user_id == user_id))
    return list(result.scalars().all())
async def get_order_by_id(
    session: AsyncSession, order_id: uuid.UUID
) -> Order | None:
    result = await session.execute(select(Order).where(Order.id == order_id))
    return result.scalar_one_or_none()
