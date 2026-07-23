import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem, MenuItemOption
from features.notifications.events import OrderPlacedEvent
from features.notifications.outbox_service import enqueue_event
from features.orders.crud import order as order_crud
from features.orders.crud import order_item as order_item_crud
from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    MenuItemUnavailableException,
    OrderingPausedException,
    OrderNotFoundException,
    RestaurantClosedAtPickupTimeException,
    RestaurantOutsideWorkingHoursException,
)
from features.orders.models import IdempotencyKey, Order
from features.orders.schemas.order import OrderCreate, OrderResponse
from features.orders.services.order_pricing import create_priced_order
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
from features.restaurants import crud as restaurant_crud
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from features.restaurants.models import Restaurant
from features.restaurants.working_hours import WorkingHours
from features.restaurants.working_hours_crud import get_working_hours, is_open_now


async def _validate_restaurant_open(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> tuple[Restaurant, list[WorkingHours]]:
    restaurant = await restaurant_crud.get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()
    if not restaurant.is_open:
        raise RestaurantClosedException()
    if is_ordering_paused(restaurant):
        raise OrderingPausedException()

    working_hours = await get_working_hours(session, restaurant.id)
    if working_hours and is_open_now(working_hours) is False:
        raise RestaurantOutsideWorkingHoursException()
    return restaurant, working_hours


async def _load_and_validate_items(
    session: AsyncSession, order_data: OrderCreate
) -> tuple[dict[uuid.UUID, MenuItem], dict[int, list[MenuItemOption]]]:
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
    return menu_items, selected_options_by_item


async def _resolve_pickup_timing(
    session: AsyncSession,
    restaurant: Restaurant,
    working_hours: list[WorkingHours],
    order_data: OrderCreate,
) -> tuple[datetime | None, datetime]:
    load = await estimate_restaurant_load(session, restaurant.id, restaurant)
    now = datetime.now(UTC)
    min_ready_at = now + timedelta(minutes=load.estimated_wait_min_minutes)
    fallback_ready_at = now + timedelta(minutes=load.estimated_wait_max_minutes)
    requested_pickup_at = validate_requested_pickup_at(order_data.requested_pickup_at, min_ready_at)
    if (
        requested_pickup_at
        and working_hours
        and is_open_at(working_hours, requested_pickup_at) is False
    ):
        raise RestaurantClosedAtPickupTimeException()
    return requested_pickup_at, fallback_ready_at


async def _finalize_order(
    session: AsyncSession,
    order: Order,
    restaurant: Restaurant,
    order_data: OrderCreate,
    idempotency_record: IdempotencyKey | None,
) -> OrderResponse:
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
        idempotency_record.completed_at = datetime.now(UTC)

    await session.commit()
    await safe_publish(f"restaurant_orders:{order.restaurant_id}", "new_order")
    return response


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

    restaurant, working_hours = await _validate_restaurant_open(session, order_data.restaurant_id)
    menu_items, selected_options_by_item = await _load_and_validate_items(session, order_data)
    requested_pickup_at, fallback_ready_at = await _resolve_pickup_timing(
        session, restaurant, working_hours, order_data
    )
    order = await create_priced_order(
        session,
        order_data,
        user_id,
        menu_items,
        selected_options_by_item,
        requested_pickup_at,
        fallback_ready_at,
    )
    return await _finalize_order(session, order, restaurant, order_data, idempotency_record)
