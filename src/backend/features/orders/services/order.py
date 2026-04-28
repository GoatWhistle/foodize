import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem, MenuItemOption
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
from features.orders.models import Order, OrderItem, OrderItemOption
from features.orders.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from features.orders.schemas.order_event import OrderEventResponse
from features.promos import service as promo_service
from features.restaurants import crud as restaurant_crud
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
from shared.exceptions import BadRequestException

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


def _validate_item_options(
    item_data,
    menu_item: MenuItem,
    options_by_id: dict[uuid.UUID, MenuItemOption],
) -> list[MenuItemOption]:
    selected_ids = item_data.selected_option_ids
    if len(selected_ids) != len(set(selected_ids)):
        raise BadRequestException(detail="Duplicate options selected")

    selected_options: list[MenuItemOption] = []
    selected_by_group: dict[uuid.UUID, int] = {}

    for option_id in selected_ids:
        option = options_by_id.get(option_id)
        if not option:
            raise BadRequestException(detail="Selected option not found")
        if option.group.menu_item_id != menu_item.id:
            raise BadRequestException(detail="Selected option does not belong to menu item")
        if not option.group.is_active or not option.is_available:
            raise BadRequestException(detail="Selected option is not available")
        selected_options.append(option)
        selected_by_group[option.group_id] = selected_by_group.get(option.group_id, 0) + 1

    for group in menu_item.option_groups:
        if not group.is_active:
            continue
        selected_count = selected_by_group.get(group.id, 0)
        min_selected = group.min_selected
        if group.is_required:
            min_selected = max(1, min_selected)
        if selected_count < min_selected:
            raise BadRequestException(detail=f"Not enough options selected for {group.name}")
        if group.max_selected is not None and selected_count > group.max_selected:
            raise BadRequestException(detail=f"Too many options selected for {group.name}")
        if group.selection_type == "single" and selected_count > 1:
            raise BadRequestException(detail=f"Only one option can be selected for {group.name}")

    return selected_options


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

    selected_option_ids = [
        option_id for item in order_data.items for option_id in item.selected_option_ids
    ]
    options_by_id = await order_item_crud.get_options_by_ids(session, selected_option_ids)

    selected_options_by_item = {
        index: _validate_item_options(item, menu_items[item.menu_item_id], options_by_id)
        for index, item in enumerate(order_data.items)
    }

    order = await _create_order(session, order_data, user_id, menu_items, selected_options_by_item)

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
    selected_options_by_item: dict[int, list[MenuItemOption]],
) -> Order:
    total_price = sum(
        (
            menu_items[item.menu_item_id].price
            + sum(option.price_delta for option in selected_options_by_item[index])
        )
        * item.quantity
        for index, item in enumerate(order_data.items)
    )
    order = Order(
        user_id=user_id,
        restaurant_id=order_data.restaurant_id,
        total_price=total_price,
    )
    session.add(order)
    await session.flush()

    for index, item_data in enumerate(order_data.items):
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            price_at_purchase=menu_items[item_data.menu_item_id].price,
        )
        session.add(order_item)
        await session.flush()
        for option in selected_options_by_item[index]:
            session.add(
                OrderItemOption(
                    order_item_id=order_item.id,
                    option_id=option.id,
                    name_snapshot=option.name,
                    price_delta_snapshot=option.price_delta,
                )
            )

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
