import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item
from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate
from features.orders.crud.order import get_order_by_id
from features.orders.exceptions import (
    InvalidStatusTransitionException,
    OrderNotCancellableException,
)
from features.orders.models import Order
from features.orders.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import (
    change_order_status,
    force_cancel_order,
    place_order,
)
from features.promos import crud as promo_crud
from features.promos.exceptions import PromoNotFoundException, PromoUsageLimitException
from features.promos.schemas import PromoCreate
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.models import User
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from shared.enums.category import Category
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


def _skip_if_not_postgres(db_session: AsyncSession) -> None:
    if db_session.bind.dialect.name != "postgresql":
        pytest.skip("Promo usage reservation uses PostgreSQL ON CONFLICT; run against Postgres")


async def _seed(db_session: AsyncSession) -> tuple[User, User, Restaurant, MenuItem]:
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79990002000",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user)
    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Promo Restaurant", address="3 Promo St", is_open=True),
        vendor_profile.id,
    )
    menu_item = await create_menu_item(
        db_session,
        MenuItemCreate(name="Shawarma", price=300, category=Category.SHAURMA),
        restaurant.id,
    )
    customer = await create_user(
        db_session,
        UserCreate(name="Customer", phone_number="79990002001", password="strongpassword1"),
    )
    return vendor_user, customer, restaurant, menu_item


async def _place(
    db_session: AsyncSession,
    restaurant: Restaurant,
    menu_item: MenuItem,
    customer_id: uuid.UUID,
    *,
    promo_code: str | None = None,
) -> OrderResponse:
    return await place_order(
        db_session,
        OrderCreate(
            restaurant_id=restaurant.id,
            items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=1)],
            promo_code=promo_code,
        ),
        customer_id,
    )


async def test_promo_second_use_by_same_user_raises_usage_limit(
    db_session: AsyncSession,
) -> None:
    _skip_if_not_postgres(db_session)
    _, customer, restaurant, menu_item = await _seed(db_session)

    await promo_crud.create_promo(
        db_session,
        PromoCreate(
            code="SAVE10",
            discount_type="PERCENT",
            discount_value=10,
            restaurant_id=restaurant.id,
            max_uses=5,
        ),
    )
    await db_session.flush()

    first = await _place(db_session, restaurant, menu_item, customer.id, promo_code="SAVE10")
    assert first.total_price < 300

    with pytest.raises(PromoUsageLimitException):
        await _place(db_session, restaurant, menu_item, customer.id, promo_code="SAVE10")


async def test_promo_usage_limit_exhausted_raises(db_session: AsyncSession) -> None:
    _skip_if_not_postgres(db_session)
    _, customer, restaurant, menu_item = await _seed(db_session)
    other = await create_user(
        db_session,
        UserCreate(name="Other", phone_number="79990002002", password="strongpassword1"),
    )

    await promo_crud.create_promo(
        db_session,
        PromoCreate(
            code="ONCE",
            discount_type="FIXED",
            discount_value=50,
            restaurant_id=restaurant.id,
            max_uses=1,
        ),
    )
    await db_session.flush()

    await _place(db_session, restaurant, menu_item, customer.id, promo_code="ONCE")

    with pytest.raises(PromoUsageLimitException):
        await _place(db_session, restaurant, menu_item, other.id, promo_code="ONCE")


async def test_failed_placement_rolls_back_and_persists_nothing(
    db_session: AsyncSession,
) -> None:
    _, customer, restaurant, menu_item = await _seed(db_session)

    with pytest.raises(PromoNotFoundException):
        await place_order(
            db_session,
            OrderCreate(
                restaurant_id=restaurant.id,
                items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=1)],
                promo_code="DOES_NOT_EXIST",
            ),
            customer.id,
        )
    await db_session.rollback()

    remaining = (
        (await db_session.execute(select(Order).where(Order.user_id == customer.id)))
        .scalars()
        .all()
    )
    assert remaining == []


async def test_cannot_force_cancel_terminal_order(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await _seed(db_session)

    order = await _place(db_session, restaurant, menu_item, customer.id)
    cancelled = await force_cancel_order(db_session, order.id, vendor_user, "test reason")
    assert cancelled.status == OrderStatus.CANCELLED

    with pytest.raises(OrderNotCancellableException):
        await force_cancel_order(db_session, order.id, vendor_user, "again")


async def test_cannot_skip_from_pending_to_ready(db_session: AsyncSession) -> None:
    vendor_user, customer, restaurant, menu_item = await _seed(db_session)

    order = await _place(db_session, restaurant, menu_item, customer.id)
    db_order = await get_order_by_id(db_session, order.id)
    assert db_order is not None

    with pytest.raises(InvalidStatusTransitionException):
        await change_order_status(
            db_session,
            db_order,
            OrderStatusUpdate(status=OrderStatus.READY),
            vendor_user,
        )
