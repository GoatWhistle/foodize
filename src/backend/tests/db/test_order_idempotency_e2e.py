import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item
from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate
from features.orders.schemas.order import OrderCreate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import place_order
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.roles import UserRole
from shared.exceptions import BadRequestException

pytestmark = pytest.mark.asyncio


async def _seed_menu(db_session: AsyncSession) -> tuple[Restaurant, MenuItem]:
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79990000102",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())
    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Idem Restaurant", address="2 Main St"),
        vendor_profile.id,
    )
    menu_item = await create_menu_item(
        db_session,
        MenuItemCreate(name="Falafel", price=250, category=Category.SHAURMA),
        restaurant.id,
    )
    return restaurant, menu_item


def _skip_if_not_postgres(db_session: AsyncSession) -> None:
    if db_session.bind.dialect.name != "postgresql":
        pytest.skip("Idempotency uses PostgreSQL ON CONFLICT; run against Postgres")


async def test_repeated_placement_same_key_returns_same_order(db_session: AsyncSession) -> None:
    _skip_if_not_postgres(db_session)
    customer = await create_user(
        db_session,
        UserCreate(name="Customer", phone_number="79990000101", password="strongpassword1"),
    )
    restaurant, menu_item = await _seed_menu(db_session)
    order_data = OrderCreate(
        restaurant_id=restaurant.id,
        items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=2)],
    )

    first = await place_order(db_session, order_data, customer.id, idempotency_key="key-1")
    second = await place_order(db_session, order_data, customer.id, idempotency_key="key-1")

    assert first.id == second.id
    assert first.display_id == second.display_id


async def test_same_key_different_payload_rejected(db_session: AsyncSession) -> None:
    _skip_if_not_postgres(db_session)
    customer = await create_user(
        db_session,
        UserCreate(name="Customer2", phone_number="79990000103", password="strongpassword1"),
    )
    restaurant, menu_item = await _seed_menu(db_session)

    await place_order(
        db_session,
        OrderCreate(
            restaurant_id=restaurant.id,
            items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=1)],
        ),
        customer.id,
        idempotency_key="key-2",
    )

    with pytest.raises(BadRequestException):
        await place_order(
            db_session,
            OrderCreate(
                restaurant_id=restaurant.id,
                items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=5)],
            ),
            customer.id,
            idempotency_key="key-2",
        )
