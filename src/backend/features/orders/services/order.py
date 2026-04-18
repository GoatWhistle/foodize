import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem
from features.orders.crud.order import (
    cancel_order,
    count_orders_by_restaurant_id,
    count_orders_by_user_id,
    create_order_event,
    get_order_by_id,
    get_orders_by_restaurant_id,
    get_orders_by_user_id,
    update_order_status,
)
from features.orders.crud.order_item import get_menu_items_by_ids
from features.orders.exceptions import (
    InvalidStatusTransitionException,
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotFoundException,
)
from features.orders.models import Order, OrderItem
from features.orders.schemas.order import OrderCreate, OrderStatusUpdate
from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from features.users.models import User
from shared.enums.order_status import OrderStatus

_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.ACCEPTED, OrderStatus.CANCELLED},
    OrderStatus.ACCEPTED: {OrderStatus.COOKING, OrderStatus.CANCELLED},
    OrderStatus.COOKING: {OrderStatus.READY},
    OrderStatus.READY: {OrderStatus.COMPLETED},
    OrderStatus.COMPLETED: set(),
    OrderStatus.CANCELLED: set(),
}


def _validate_transition(old: OrderStatus, new: OrderStatus) -> None:
    if new not in _ALLOWED_TRANSITIONS.get(old, set()):
        raise InvalidStatusTransitionException()


async def place_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
) -> Order:
    restaurant = await get_restaurant_by_id(session, order_data.restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()
    if not restaurant.is_open:
        raise RestaurantClosedException()

    menu_item_ids = [item.menu_item_id for item in order_data.items]
    menu_items = await get_menu_items_by_ids(session, menu_item_ids)

    if len(menu_items) != len(menu_item_ids):
        raise MenuItemsNotFoundException()

    if any(mi.restaurant_id != order_data.restaurant_id for mi in menu_items.values()):
        raise MenuItemRestaurantMismatchException()

    return await _create_order(session, order_data, user_id, menu_items)


async def _create_order(
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


async def get_user_orders(
    session: AsyncSession,
    user_id: uuid.UUID,
    status: OrderStatus | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Order], int]:
    offset = (page - 1) * size
    data = await get_orders_by_user_id(session, user_id, status=status, offset=offset, limit=size)
    total = await count_orders_by_user_id(session, user_id, status=status)
    return data, total


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


async def get_restaurant_orders(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    status: OrderStatus | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Order], int]:
    offset = (page - 1) * size
    data = await get_orders_by_restaurant_id(
        session, restaurant_id, status=status, offset=offset, limit=size
    )
    total = await count_orders_by_restaurant_id(session, restaurant_id, status=status)
    return data, total


async def change_order_status(
    session: AsyncSession,
    order: Order,
    status_data: OrderStatusUpdate,
    actor: User,
) -> Order:
    old_status = order.status
    _validate_transition(old_status, status_data.status)
    updated = await update_order_status(session, order, status_data.status)
    await create_order_event(
        session,
        order_id=order.id,
        actor_id=actor.id,
        actor_role=actor.user_role.value,
        old_status=old_status,
        new_status=status_data.status,
    )
    return updated


async def cancel_customer_order(
    session: AsyncSession,
    order: Order,
    user_id: uuid.UUID,
) -> Order:
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    if order.status != OrderStatus.PENDING:
        raise OrderNotCancellableException()
    return await cancel_order(session, order)
