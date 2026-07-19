import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.orders.schemas.order import OrderResponse
from features.orders.services.order_placement import place_order

from .order_helpers import make_menu_item, make_order, make_order_data, make_restaurant


async def test_place_order_idempotency_hit() -> None:
    restaurant = make_restaurant()
    data = make_order_data(restaurant_id=restaurant.id)
    stored = OrderResponse.model_validate(make_order())

    idempotency_record = MagicMock()
    idempotency_record.response_json = stored.model_dump(mode="json")

    with patch(
        "features.orders.services.order_placement.start_idempotency_record",
        new_callable=AsyncMock,
        return_value=idempotency_record,
    ):
        result = await place_order(AsyncMock(), data, uuid.uuid4(), idempotency_key="key123")

    assert isinstance(result, OrderResponse)
    assert result.id == stored.id


async def test_place_order_success() -> None:
    restaurant = make_restaurant()
    data = make_order_data(restaurant_id=restaurant.id)
    item_id = data.items[0].menu_item_id

    mi = make_menu_item(restaurant.id)
    mi.id = item_id
    mi.option_groups = []

    mock_order = make_order()
    mock_order.restaurant_id = restaurant.id

    mock_load = MagicMock()
    mock_load.estimated_wait_min_minutes = 15
    mock_load.estimated_wait_max_minutes = 30

    session = AsyncMock()
    session.add = MagicMock()
    session.add_all = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.services.order_placement.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "features.orders.crud.order_item.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={item_id: mi},
        ),
        patch(
            "features.orders.crud.order_item.get_options_by_ids",
            new_callable=AsyncMock,
            return_value={},
        ),
        patch(
            "features.orders.crud.order.count_orders_by_user_id",
            new_callable=AsyncMock,
            return_value=0,
        ),
        patch(
            "features.orders.services.order_placement.estimate_restaurant_load",
            new_callable=AsyncMock,
            return_value=mock_load,
        ),
        patch(
            "features.orders.crud.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils.safe_publish", new_callable=AsyncMock),
        patch(
            "features.orders.crud.order_placement.insert_order_with_items",
            new_callable=AsyncMock,
            return_value=mock_order,
        ),
    ):
        result = await place_order(session, data, uuid.uuid4())

    assert isinstance(result, OrderResponse)
    assert result.id == mock_order.id
