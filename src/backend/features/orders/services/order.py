import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent
from features.notifications.publisher import publish_order_placed, publish_order_status_changed
from features.orders.crud import order as order_crud
from features.orders.crud import order_item as order_item_crud
from features.orders.exceptions import (
    InvalidStatusTransitionException,
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    MenuItemUnavailableException,
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotCompletableException,
    OrderNotFoundException,
)
from features.orders.models import Order, OrderItem
from features.orders.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from features.orders.schemas.order_event import OrderEventResponse
from features.promos import service as promo_service
from features.restaurants import crud as restaurant_crud
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole

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
) -> OrderResponse:
    restaurant = await restaurant_crud.get_restaurant_by_id(session, order_data.restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()
    if not restaurant.is_open:
        raise RestaurantClosedException()

    menu_item_ids = [item.menu_item_id for item in order_data.items]
    menu_items = await order_item_crud.get_menu_items_by_ids(session, menu_item_ids)

    if len(menu_items) != len(menu_item_ids):
        raise MenuItemsNotFoundException()

    if any(mi.restaurant_id != order_data.restaurant_id for mi in menu_items.values()):
        raise MenuItemRestaurantMismatchException()

    if any(not mi.is_available for mi in menu_items.values()):
        raise MenuItemUnavailableException()

    order = await _create_order(session, order_data, user_id, menu_items)

    if order_data.promo_code:
        new_total = await promo_service.apply_promo(
            session, order_data.promo_code, order_data.restaurant_id, order.total_price
        )
        if new_total != order.total_price:
            order.total_price = new_total
            await session.commit()
            await session.refresh(order)

    await publish_order_placed(
        OrderPlacedEvent(
            order_id=order.id,
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=restaurant.name,
            total_price=order.total_price,
            items_count=len(order.items),
        )
    )
    return OrderResponse.model_validate(order)


async def _create_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    menu_items: dict,
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
    result = await order_crud.get_order_by_id(session, order.id)
    if result is None:
        raise OrderNotFoundException()
    return result


async def get_user_orders(
    session: AsyncSession,
    user_id: uuid.UUID,
    status: OrderStatus | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[OrderResponse], int]:
    offset = (page - 1) * size
    data = await order_crud.get_orders_by_user_id(
        session, user_id, status=status, offset=offset, limit=size
    )
    total = await order_crud.count_orders_by_user_id(session, user_id, status=status)
    return [OrderResponse.model_validate(o) for o in data], total


async def get_order(
    session: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> OrderResponse:
    order = await order_crud.get_order_by_id(session, order_id)
    if not order:
        raise OrderNotFoundException()
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    return OrderResponse.model_validate(order)


async def get_restaurant_orders(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    status: OrderStatus | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[OrderResponse], int]:
    offset = (page - 1) * size
    data = await order_crud.get_orders_by_restaurant_id(
        session, restaurant_id, status=status, offset=offset, limit=size
    )
    total = await order_crud.count_orders_by_restaurant_id(session, restaurant_id, status=status)
    return [OrderResponse.model_validate(o) for o in data], total


async def change_order_status(
    session: AsyncSession,
    order: Order,
    status_data: OrderStatusUpdate,
    actor: User,
) -> OrderResponse:
    old_status = OrderStatus(order.status)
    _validate_transition(old_status, status_data.status)
    updated = await order_crud.update_order_status(session, order, status_data.status)
    await order_crud.create_order_event(
        session,
        order_id=order.id,
        actor_id=actor.id,
        actor_role=actor.user_role,
        old_status=old_status,
        new_status=status_data.status,
    )
    await publish_order_status_changed(
        OrderStatusChangedEvent(
            order_id=order.id,
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=order.restaurant.name,
            old_status=old_status,
            new_status=status_data.status,
            total_price=order.total_price,
        )
    )
    return OrderResponse.model_validate(updated)


async def cancel_order(
    session: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> OrderResponse:
    order = await order_crud.get_order_by_id(session, order_id)
    if not order:
        raise OrderNotFoundException()
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    if order.status != OrderStatus.PENDING.value:
        raise OrderNotCancellableException()
    old_status = OrderStatus(order.status)
    cancelled = await order_crud.cancel_order(session, order)
    await order_crud.create_order_event(
        session,
        order_id=order.id,
        actor_id=user_id,
        actor_role=UserRole.CUSTOMER.value,
        old_status=old_status,
        new_status=OrderStatus.CANCELLED,
    )
    await publish_order_status_changed(
        OrderStatusChangedEvent(
            order_id=order.id,
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=order.restaurant.name,
            old_status=old_status,
            new_status=OrderStatus.CANCELLED,
            total_price=order.total_price,
        )
    )
    return OrderResponse.model_validate(cancelled)


async def complete_order(
    session: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> OrderResponse:
    order = await order_crud.get_order_by_id(session, order_id)
    if not order:
        raise OrderNotFoundException()
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    if order.status != OrderStatus.READY.value:
        raise OrderNotCompletableException()
    old_status = OrderStatus(order.status)
    completed = await order_crud.update_order_status(session, order, OrderStatus.COMPLETED)
    await order_crud.create_order_event(
        session,
        order_id=order.id,
        actor_id=user_id,
        actor_role=UserRole.CUSTOMER.value,
        old_status=old_status,
        new_status=OrderStatus.COMPLETED,
    )
    await publish_order_status_changed(
        OrderStatusChangedEvent(
            order_id=order.id,
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=order.restaurant.name,
            old_status=old_status,
            new_status=OrderStatus.COMPLETED,
            total_price=order.total_price,
        )
    )
    return OrderResponse.model_validate(completed)


async def get_order_events(
    session: AsyncSession,
    order_id: uuid.UUID,
) -> list[OrderEventResponse]:
    events = await order_crud.get_events_by_order_id(session, order_id)
    return [OrderEventResponse.model_validate(e) for e in events]
