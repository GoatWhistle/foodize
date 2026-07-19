import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item
from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate
from features.orders.crud.order import get_order_by_id
from features.orders.exceptions import InvalidStatusTransitionException
from features.orders.schemas.order import OrderCreate, OrderStatusUpdate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import change_order_status, place_order
from features.restaurants.crud import create_restaurant
from features.restaurants.exceptions import RestaurantClosedException
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.models import User
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


async def _seed_restaurant(
    db_session: AsyncSession, *, is_open: bool
) -> tuple[User, Restaurant, MenuItem]:
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79990001000",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())
    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Err Restaurant", address="2 Error St", is_open=is_open),
        vendor_profile.id,
    )
    menu_item = await create_menu_item(
        db_session,
        MenuItemCreate(name="Falafel", price=200, category=Category.SHAURMA),
        restaurant.id,
    )
    return vendor_user, restaurant, menu_item


async def test_place_order_in_closed_restaurant_raises(db_session: AsyncSession) -> None:
    customer = await create_user(
        db_session,
        UserCreate(
            name="Customer",
            phone_number="79990001001",
            password="strongpassword1",
        ),
    )
    _, restaurant, menu_item = await _seed_restaurant(db_session, is_open=False)

    with pytest.raises(RestaurantClosedException):
        await place_order(
            db_session,
            OrderCreate(
                restaurant_id=restaurant.id,
                items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=1)],
            ),
            customer.id,
        )


async def test_invalid_status_transition_raises(db_session: AsyncSession) -> None:
    customer = await create_user(
        db_session,
        UserCreate(
            name="Customer",
            phone_number="79990001002",
            password="strongpassword1",
        ),
    )
    vendor_user, restaurant, menu_item = await _seed_restaurant(db_session, is_open=True)

    order = await place_order(
        db_session,
        OrderCreate(
            restaurant_id=restaurant.id,
            items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=1)],
        ),
        customer.id,
    )
    assert order.status == OrderStatus.PENDING

    db_order = await get_order_by_id(db_session, order.id)
    assert db_order is not None

    with pytest.raises(InvalidStatusTransitionException):
        await change_order_status(
            db_session,
            db_order,
            OrderStatusUpdate(status=OrderStatus.COMPLETED),
            vendor_user,
        )
