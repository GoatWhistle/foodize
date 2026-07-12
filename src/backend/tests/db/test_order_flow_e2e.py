import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item
from features.menu.schemas import MenuItemCreate
from features.orders.crud.order import get_order_by_id
from features.orders.schemas.order import OrderCreate, OrderStatusUpdate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import change_order_status, place_order
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


@pytest.mark.asyncio
async def test_full_order_flow_from_signup_to_completion(db_session: AsyncSession) -> None:
    customer = await create_user(
        db_session,
        UserCreate(
            name="Customer",
            phone_number="79990000001",
            password="strongpassword1",
        ),
    )

    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79990000002",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())

    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="E2E Restaurant", address="1 Main St"),
        vendor_profile.id,
    )

    menu_item = await create_menu_item(
        db_session,
        MenuItemCreate(name="Burger", price=350, category=Category.SHAURMA),
        restaurant.id,
    )

    order = await place_order(
        db_session,
        OrderCreate(
            restaurant_id=restaurant.id,
            items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=2)],
        ),
        customer.id,
    )

    assert order.status == OrderStatus.PENDING
    assert order.total_price == 700

    db_order = await get_order_by_id(db_session, order.id)
    assert db_order is not None

    await change_order_status(
        db_session,
        db_order,
        OrderStatusUpdate(status=OrderStatus.ACCEPTED, estimated_ready_in_minutes=15),
        vendor_user,
    )
    db_order = await get_order_by_id(db_session, order.id)
    assert db_order is not None
    assert db_order.status == OrderStatus.ACCEPTED.value

    await change_order_status(
        db_session,
        db_order,
        OrderStatusUpdate(status=OrderStatus.READY),
        vendor_user,
    )
    db_order = await get_order_by_id(db_session, order.id)
    assert db_order is not None
    assert db_order.status == OrderStatus.READY.value

    await change_order_status(
        db_session,
        db_order,
        OrderStatusUpdate(status=OrderStatus.COMPLETED),
        vendor_user,
    )
    db_order = await get_order_by_id(db_session, order.id)
    assert db_order is not None
    assert db_order.status == OrderStatus.COMPLETED.value
