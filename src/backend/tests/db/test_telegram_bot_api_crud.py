from typing import Any, cast

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.orders.models import Order
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.telegram.bot_api import (
    get_active_orders_for_telegram_id,
    get_telegram_id_for_user_id,
    get_vendor_status_for_telegram_id,
    link_phone_from_bot,
    register_from_bot,
)
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


@pytest.fixture(autouse=True)
def _no_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Cache:
        async def set(self, *args: Any, **kwargs: Any) -> None:
            return None

        async def delete(self, *args: Any, **kwargs: Any) -> None:
            return None

    monkeypatch.setattr("features.telegram._shared.get_redis_cache", lambda: _Cache())


async def test_register_from_bot_creates_user(db_session: AsyncSession) -> None:
    user = await register_from_bot(db_session, 700001, "@BotUser", "Bot User")
    assert user.telegram_id == 700001
    assert user.telegram_username == "botuser"
    assert user.phone_number == "tg_700001"


async def test_register_from_bot_without_username(db_session: AsyncSession) -> None:
    user = await register_from_bot(db_session, 700010, None, "No Name")
    assert user.telegram_username is None


async def test_link_phone_from_bot(db_session: AsyncSession) -> None:
    user = await link_phone_from_bot(db_session, 700002, "linker", "79001112233", "Linker")
    assert user.telegram_id == 700002
    assert user.phone_number == "79001112233"


async def test_get_vendor_status_none_when_no_user(db_session: AsyncSession) -> None:
    assert await get_vendor_status_for_telegram_id(db_session, 700404) is None


async def test_get_vendor_status_returns_profile(db_session: AsyncSession) -> None:
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="V",
            phone_number="79003334455",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_user.telegram_id = 700003
    await db_session.flush()
    profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())

    result = await get_vendor_status_for_telegram_id(db_session, 700003)
    assert result is not None
    assert result.id == profile.id


async def test_get_telegram_id_for_user_id(db_session: AsyncSession) -> None:
    user = await create_user(
        db_session,
        UserCreate(
            name="C",
            phone_number="79004445566",
            password="strongpassword1",
            user_role=UserRole.CUSTOMER,
        ),
    )
    user.telegram_id = 700005
    await db_session.flush()

    assert await get_telegram_id_for_user_id(db_session, cast("str", user.id)) == 700005


async def test_get_active_orders_empty_when_no_user(db_session: AsyncSession) -> None:
    assert await get_active_orders_for_telegram_id(db_session, 700777) == []


async def test_get_active_orders_returns_active_only(db_session: AsyncSession) -> None:
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="V2",
            phone_number="79005556677",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())
    restaurant = await create_restaurant(
        db_session, RestaurantCreate(name="Rest", address="Addr"), profile.id
    )
    customer = await create_user(
        db_session,
        UserCreate(
            name="Cust",
            phone_number="79006667788",
            password="strongpassword1",
            user_role=UserRole.CUSTOMER,
        ),
    )
    customer.telegram_id = 700006
    await db_session.flush()

    active = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        status=OrderStatus.PENDING.value,
        total_price=1000,
    )
    completed = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        status=OrderStatus.COMPLETED.value,
        total_price=500,
    )
    db_session.add_all([active, completed])
    await db_session.flush()

    orders = await get_active_orders_for_telegram_id(db_session, 700006)
    assert len(orders) == 1
    assert orders[0].status == OrderStatus.PENDING.value
