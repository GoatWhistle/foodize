import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem, MenuItemOption
from features.orders.models import Order, OrderItem, OrderItemOption
from features.orders.schemas.order import OrderCreate


async def insert_order_with_items(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    total_price: int,
    menu_items: dict[uuid.UUID, MenuItem],
    selected_options_by_item: dict[int, list[MenuItemOption]],
    estimated_ready_at: datetime | None,
    requested_pickup_at: datetime | None,
) -> Order:
    order = Order(
        user_id=user_id,
        restaurant_id=order_data.restaurant_id,
        total_price=total_price,
        comment=order_data.comment,
        requested_pickup_at=requested_pickup_at,
        estimated_ready_at=estimated_ready_at,
    )
    session.add(order)
    await session.flush()

    order_items = [
        (
            OrderItem(
                order_id=order.id,
                menu_item_id=item_data.menu_item_id,
                quantity=item_data.quantity,
                price_at_purchase=menu_items[item_data.menu_item_id].price,
            ),
            index,
        )
        for index, item_data in enumerate(order_data.items)
    ]
    session.add_all([order_item for order_item, _ in order_items])
    await session.flush()

    for order_item, index in order_items:
        for option in selected_options_by_item[index]:
            session.add(
                OrderItemOption(
                    order_item_id=order_item.id,
                    option_id=option.id,
                    name_snapshot=option.name,
                    price_delta_snapshot=option.price_delta,
                )
            )
    await session.flush()
    return order
