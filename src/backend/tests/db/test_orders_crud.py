import uuid

import pytest
from shared.enums.roles import UserRole

from features.menu.models import MenuItem
from features.orders.crud.order import (
    cancel_order,
    count_orders_by_restaurant_id,
    count_orders_by_user_id,
    create_order_event,
    get_events_by_order_id,
    get_order_by_id,
    get_orders_by_restaurant_id,
    get_orders_by_user_id,
    update_order_status,
)
from features.orders.models import Order, OrderItem
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.order_status import OrderStatus


async def _make_vendor_and_restaurant(db_session):
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79002222222",
            password="strongpassword",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())
    restaurant = await create_restaurant(
        db_session, RestaurantCreate(name="Rest", address="Addr"), vendor_profile.id
    )
    return vendor_user, vendor_profile, restaurant


async def _make_customer(db_session):
    return await create_user(
        db_session,
        UserCreate(
            name="Customer",
            phone_number="79001111111",
            password="strongpassword",
            user_role=UserRole.CUSTOMER,
        ),
    )


async def _place_raw_order(db_session, customer, restaurant, menu_item, quantity=2):
    total_price = menu_item.price * quantity
    order = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=total_price,
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        order_id=order.id,
        menu_item_id=menu_item.id,
        quantity=quantity,
        price_at_purchase=menu_item.price,
    )
    db_session.add(order_item)
    await db_session.commit()
    return order


@pytest.mark.asyncio
async def test_order_crud_flow(db_session):
    customer = await _make_customer(db_session)
    _, _, restaurant = await _make_vendor_and_restaurant(db_session)

    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Pizza",
        description="Cheese",
        price=500,
        category=Category.SHAURMA.value,
    )
    db_session.add(menu_item)
    await db_session.commit()

    order = await _place_raw_order(db_session, customer, restaurant, menu_item)

    assert order.id is not None
    assert order.user_id == customer.id
    assert order.total_price == 1000

    fetched = await get_order_by_id(db_session, order.id)
    assert fetched is not None
    assert fetched.id == order.id
    assert len(fetched.items) == 1
    assert fetched.items[0].menu_item.name == "Pizza"

    assert await get_order_by_id(db_session, uuid.uuid4()) is None

    user_orders = await get_orders_by_user_id(db_session, customer.id)
    assert len(user_orders) == 1
    assert user_orders[0].id == order.id

    rest_orders = await get_orders_by_restaurant_id(db_session, restaurant.id)
    assert len(rest_orders) == 1

    assert await count_orders_by_user_id(db_session, customer.id) == 1
    assert await count_orders_by_restaurant_id(db_session, restaurant.id) == 1


@pytest.mark.asyncio
async def test_update_order_status(db_session):
    customer = await _make_customer(db_session)
    _, _, restaurant = await _make_vendor_and_restaurant(db_session)

    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Burger",
        description="Beef",
        price=300,
        category=Category.SHAURMA.value,
    )
    db_session.add(menu_item)
    await db_session.commit()

    order = await _place_raw_order(db_session, customer, restaurant, menu_item, quantity=1)
    assert order.status == OrderStatus.PENDING.value

    updated = await update_order_status(db_session, order, OrderStatus.ACCEPTED)
    assert updated.status == OrderStatus.ACCEPTED.value


@pytest.mark.asyncio
async def test_cancel_order(db_session):
    customer = await _make_customer(db_session)
    _, _, restaurant = await _make_vendor_and_restaurant(db_session)

    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Wrap",
        description="Veggie",
        price=200,
        category=Category.SHAURMA.value,
    )
    db_session.add(menu_item)
    await db_session.commit()

    order = await _place_raw_order(db_session, customer, restaurant, menu_item, quantity=1)
    cancelled = await cancel_order(db_session, order)
    assert cancelled.status == OrderStatus.CANCELLED.value


@pytest.mark.asyncio
async def test_create_and_get_order_events(db_session):
    customer = await _make_customer(db_session)
    vendor_user, _, restaurant = await _make_vendor_and_restaurant(db_session)

    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Shawarma",
        description="Chicken",
        price=250,
        category=Category.SHAURMA.value,
    )
    db_session.add(menu_item)
    await db_session.commit()

    order = await _place_raw_order(db_session, customer, restaurant, menu_item, quantity=1)

    event = await create_order_event(
        db_session,
        order_id=order.id,
        actor_id=vendor_user.id,
        actor_role=UserRole.VENDOR.value,
        old_status=OrderStatus.PENDING,
        new_status=OrderStatus.ACCEPTED,
    )
    assert event.id is not None
    assert event.old_status == OrderStatus.PENDING.value
    assert event.new_status == OrderStatus.ACCEPTED.value

    events = await get_events_by_order_id(db_session, order.id)
    assert len(events) == 1
    assert events[0].id == event.id


@pytest.mark.asyncio
async def test_count_filters_by_status(db_session):
    customer = await _make_customer(db_session)
    _, _, restaurant = await _make_vendor_and_restaurant(db_session)

    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Combo",
        description="All-in",
        price=400,
        category=Category.SHAURMA.value,
    )
    db_session.add(menu_item)
    await db_session.commit()

    order = await _place_raw_order(db_session, customer, restaurant, menu_item, quantity=1)

    assert await count_orders_by_user_id(db_session, customer.id, OrderStatus.PENDING) == 1
    assert await count_orders_by_user_id(db_session, customer.id, OrderStatus.ACCEPTED) == 0

    await update_order_status(db_session, order, OrderStatus.ACCEPTED)

    assert await count_orders_by_user_id(db_session, customer.id, OrderStatus.ACCEPTED) == 1
    assert await count_orders_by_user_id(db_session, customer.id, OrderStatus.PENDING) == 0
