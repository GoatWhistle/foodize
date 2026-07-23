import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from features.loyalty import order_integration as loyalty_service
from features.menu.models import MenuItem, MenuItemOption
from features.orders.crud import order as order_crud
from features.orders.crud import order_placement as order_placement_crud
from features.orders.models import Order
from features.orders.schemas.order import OrderCreate
from features.promos import service as promo_service
from shared.enums.order_status import OrderStatus


def _category_subtotal(
    order_data: OrderCreate,
    menu_items: dict[uuid.UUID, MenuItem],
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


def _compute_total_price(
    order_data: OrderCreate,
    menu_items: dict[uuid.UUID, MenuItem],
    selected_options_by_item: dict[int, list[MenuItemOption]],
) -> int:
    return sum(
        (
            menu_items[item.menu_item_id].price
            + sum(option.price_delta for option in selected_options_by_item[index])
        )
        * item.quantity
        for index, item in enumerate(order_data.items)
    )


async def _create_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    menu_items: dict[uuid.UUID, MenuItem],
    selected_options_by_item: dict[int, list[MenuItemOption]],
    estimated_ready_at: datetime | None = None,
    requested_pickup_at: datetime | None = None,
) -> Order:
    total_price = _compute_total_price(order_data, menu_items, selected_options_by_item)
    return await order_placement_crud.insert_order_with_items(
        session,
        order_data,
        user_id,
        total_price,
        menu_items,
        selected_options_by_item,
        estimated_ready_at,
        requested_pickup_at,
    )


async def _apply_promo_if_any(
    session: AsyncSession,
    order: Order,
    order_data: OrderCreate,
    menu_items: dict[uuid.UUID, MenuItem],
    selected_options_by_item: dict[int, list[MenuItemOption]],
    user_id: uuid.UUID,
    is_first_order: bool,
) -> None:
    if not order_data.promo_code:
        return
    promo = await promo_service.get_promo_for_order(session, order_data.promo_code)
    discount_base = (
        _category_subtotal(order_data, menu_items, selected_options_by_item, promo.menu_category)
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


async def create_priced_order(
    session: AsyncSession,
    order_data: OrderCreate,
    user_id: uuid.UUID,
    menu_items: dict[uuid.UUID, MenuItem],
    selected_options_by_item: dict[int, list[MenuItemOption]],
    requested_pickup_at: datetime | None,
    fallback_ready_at: datetime,
) -> Order:
    total_orders = await order_crud.count_orders_by_user_id(
        session, user_id, exclude_status=OrderStatus.CANCELLED
    )
    order = await _create_order(
        session,
        order_data,
        user_id,
        menu_items,
        selected_options_by_item,
        estimated_ready_at=requested_pickup_at or fallback_ready_at,
        requested_pickup_at=requested_pickup_at,
    )
    await _apply_promo_if_any(
        session,
        order,
        order_data,
        menu_items,
        selected_options_by_item,
        user_id,
        is_first_order=total_orders == 0,
    )
    await loyalty_service.apply_redemption(
        session,
        order,
        user_id,
        menu_items,
        redeem_points=order_data.redeem_points,
        reward_id=order_data.loyalty_reward_id,
    )
    return order
