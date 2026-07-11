import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItemOption
from features.notifications.events import OrderPlacedEvent
from features.notifications.outbox_service import enqueue_event
from features.orders.crud import order as order_crud
from features.orders.crud import order_item as order_item_crud
from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    MenuItemUnavailableException,
    OrderNotFoundException,
)
from features.orders.models import Order, OrderItem, OrderItemOption
from features.orders.schemas.order import OrderCreate, OrderResponse
from features.orders.services.order_queries import estimate_restaurant_load
from features.orders.services.order_utils import (
    is_open_at,
    is_ordering_paused,
    make_request_hash,
    safe_publish,
    start_idempotency_record,
    validate_item_options,
    validate_requested_pickup_at,
)
from features.promos import service as promo_service
from features.restaurants import crud as restaurant_crud
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from features.restaurants.working_hours_crud import get_working_hours, is_open_now
from shared.enums.order_status import OrderStatus


async def place_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    idempotency_key: str | None = None,
) -> OrderResponse:
    request_hash = make_request_hash(order_data)
    idempotency_record = await start_idempotency_record(
        session, user_id, idempotency_key, request_hash
    )
    if idempotency_record and idempotency_record.response_json:
        return OrderResponse.model_validate(idempotency_record.response_json)

    restaurant = await restaurant_crud.get_restaurant_by_id(session, order_data.restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()
    if not restaurant.is_open:
        raise RestaurantClosedException()
    if is_ordering_paused(restaurant):
        raise RestaurantClosedException(detail="Restaurant is temporarily not accepting orders")

    working_hours = await get_working_hours(session, restaurant.id)
    if working_hours and is_open_now(working_hours) is False:
        raise RestaurantClosedException(
            detail="Restaurant is currently closed (outside working hours)"
        )

    menu_item_ids = [item.menu_item_id for item in order_data.items]
    menu_items = await order_item_crud.get_menu_items_by_ids(
        session, menu_item_ids, for_update=True
    )

    if len(menu_items) != len(menu_item_ids):
        raise MenuItemsNotFoundException()
    if any(mi.restaurant_id != order_data.restaurant_id for mi in menu_items.values()):
        raise MenuItemRestaurantMismatchException()
    if any(not mi.is_available for mi in menu_items.values()):
        raise MenuItemUnavailableException()

    selected_option_ids = [
        option_id for item in order_data.items for option_id in item.selected_option_ids
    ]
    options_by_id = await order_item_crud.get_options_by_ids(
        session, selected_option_ids, for_update=True
    )
    selected_options_by_item = {
        index: validate_item_options(item, menu_items[item.menu_item_id], options_by_id)
        for index, item in enumerate(order_data.items)
    }

    total_orders = await order_crud.count_orders_by_user_id(
        session, user_id, exclude_status=OrderStatus.CANCELLED
    )
    is_first_order = total_orders == 0

    load = await estimate_restaurant_load(session, restaurant.id, restaurant)
    min_ready_at = datetime.now(timezone.utc) + timedelta(minutes=load.estimated_wait_min_minutes)
    fallback_ready_at = datetime.now(timezone.utc) + timedelta(
        minutes=load.estimated_wait_max_minutes
    )
    requested_pickup_at = validate_requested_pickup_at(order_data.requested_pickup_at, min_ready_at)
    if (
        requested_pickup_at
        and working_hours
        and is_open_at(working_hours, requested_pickup_at) is False
    ):
        raise RestaurantClosedException(detail="Restaurant is closed at requested pickup time")

    order = await _create_order(
        session,
        order_data,
        user_id,
        menu_items,
        selected_options_by_item,
        estimated_ready_at=requested_pickup_at or fallback_ready_at,
        requested_pickup_at=requested_pickup_at,
    )

    if order_data.promo_code:
        promo = await promo_service.get_promo_for_order(session, order_data.promo_code)
        discount_base = (
            _category_subtotal(
                order_data, menu_items, selected_options_by_item, promo.menu_category
            )
            if promo and promo.menu_category
            else order.total_price
        )
        new_total = await promo_service.apply_promo(
            session,
            order_data.promo_code,
            order_data.restaurant_id,
            order.total_price,
            is_first_order=is_first_order,
            user_id=user_id,
            discount_base=discount_base,
        )
        if new_total != order.total_price:
            order.total_price = new_total
        if promo:
            order.promo_id = promo.id

    await enqueue_event(
        session,
        OrderPlacedEvent(
            order_id=order.id,
            order_display_id=str(order.display_id),
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=restaurant.name,
            total_price=order.total_price,
            items_count=len(order_data.items),
        ),
    )

    result = await order_crud.get_order_by_id(session, order.id)
    if result is None:
        raise OrderNotFoundException()
    response = OrderResponse.model_validate(result)

    if idempotency_record:
        idempotency_record.order_id = order.id
        idempotency_record.response_json = response.model_dump(mode="json")
        idempotency_record.completed_at = datetime.now(timezone.utc)

    await session.commit()
    await safe_publish(f"restaurant_orders:{order.restaurant_id}", "new_order")
    return response


def _category_subtotal(
    order_data: OrderCreate,
    menu_items: dict,
    selected_options_by_item: dict[int, list[MenuItemOption]],
    menu_category: str,
) -> int:
    subtotal = 0
    for index, item in enumerate(order_data.items):
        menu_item = menu_items[item.menu_item_id]
        if menu_item.category != menu_category:
            continue
        options_delta = sum(option.price_delta for option in selected_options_by_item[index])
        subtotal += (menu_item.price + options_delta) * item.quantity
    return subtotal


async def _create_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    menu_items: dict,
    selected_options_by_item: dict[int, list[MenuItemOption]],
    estimated_ready_at: datetime | None = None,
    requested_pickup_at: datetime | None = None,
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
        comment=order_data.comment,
        requested_pickup_at=requested_pickup_at,
        estimated_ready_at=estimated_ready_at,
    )
    session.add(order)
    await session.flush()

    order_items = []
    for index, item_data in enumerate(order_data.items):
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            price_at_purchase=menu_items[item_data.menu_item_id].price,
        )
        order_items.append((order_item, index))

    session.add_all([oi for oi, _ in order_items])
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
