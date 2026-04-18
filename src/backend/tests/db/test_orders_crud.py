import pytest

from features.menu.models import MenuItem
from features.orders.crud.order import get_order_by_id, get_orders_by_user_id
from features.orders.schemas.order import OrderCreate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import _create_order
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.roles import UserRole


@pytest.mark.asyncio
async def test_order_crud_flow(db_session):
    customer_data = UserCreate(
        name="Customer",
        phone_number="79001111111",
        password="strongpassword",
        user_role=UserRole.CUSTOMER,
    )
    customer = await create_user(db_session, customer_data)

    vendor_data = UserCreate(
        name="Vendor",
        phone_number="79002222222",
        password="strongpassword",
        user_role=UserRole.VENDOR,
    )
    vendor_user = await create_user(db_session, vendor_data)
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())

    restaurant_data = RestaurantCreate(name="Rest", address="Addr")
    restaurant = await create_restaurant(db_session, restaurant_data, vendor_profile.id)

    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Pizza",
        description="Cheese",
        price=500,
        category=Category.SHAURMA.value,
    )
    db_session.add(menu_item)
    await db_session.commit()

    order_in = OrderCreate(
        restaurant_id=restaurant.id, items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=2)]
    )

    menu_items_map = {menu_item.id: menu_item}

    order = await _create_order(db_session, order_in, customer.id, menu_items_map)

    assert order.id is not None
    assert order.user_id == customer.id
    assert order.total_price == 1000

    orders_for_user = await get_orders_by_user_id(db_session, customer.id)
    assert len(orders_for_user) == 1
    assert orders_for_user[0].id == order.id

    fetched_order = await get_order_by_id(db_session, order.id)
    assert fetched_order is not None
    assert fetched_order.id == order.id
    assert len(fetched_order.items) == 1
    assert fetched_order.items[0].menu_item.name == "Pizza"
