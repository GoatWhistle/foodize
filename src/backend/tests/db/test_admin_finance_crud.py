import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud.finance import get_finance_analytics
from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.models import VendorProfile
from shared.enums.category import Category
from shared.enums.order_status import OrderStatus


@dataclass(frozen=True)
class FinanceSeed:
    vendor_profile: VendorProfile
    restaurant: Restaurant
    menu_item: MenuItem
    now: datetime


@pytest.fixture
async def finance_db(db_session: AsyncSession) -> FinanceSeed:
    vendor_user = await create_user(
        db_session,
        UserCreate(name="Vendor", phone_number="79009009001", password="strongpassword1"),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user)
    customer = await create_user(
        db_session,
        UserCreate(name="Customer", phone_number="79009009002", password="strongpassword1"),
    )
    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Finance Rest", address="Fin St"),
        vendor_profile.id,
    )
    menu_item = MenuItem(
        restaurant_id=restaurant.id,
        name="Burger",
        description="Tasty",
        price=250,
        category=Category.BURGER.value,
    )
    db_session.add(menu_item)
    await db_session.flush()

    now = datetime.now(UTC)
    completed = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=500,
        status=OrderStatus.COMPLETED.value,
    )
    completed.created_at = now - timedelta(days=1)
    cancelled = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=100,
        status=OrderStatus.CANCELLED.value,
    )
    cancelled.created_at = now - timedelta(days=1)
    prev_completed = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=200,
        status=OrderStatus.COMPLETED.value,
    )
    prev_completed.created_at = now - timedelta(days=20)
    db_session.add_all([completed, cancelled, prev_completed])
    await db_session.flush()

    item = OrderItem(
        order_id=completed.id,
        menu_item_id=menu_item.id,
        quantity=2,
        price_at_purchase=250,
    )
    db_session.add(item)
    await db_session.commit()

    return FinanceSeed(
        vendor_profile=vendor_profile,
        restaurant=restaurant,
        menu_item=menu_item,
        now=now,
    )


async def test_get_finance_analytics_full_path(
    db_session: AsyncSession, finance_db: FinanceSeed
) -> None:
    now = finance_db.now
    result = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=5)).date(),
        date_to=now.date(),
    )
    assert result.total_orders == 2
    assert result.completed_orders == 1
    assert result.cancelled_orders == 1
    assert result.total_revenue == 500
    assert result.average_check == 500.0
    assert result.conversion_percent == 50.0
    assert len(result.top_restaurants) == 1
    assert result.top_restaurants[0].revenue == 500
    assert result.top_restaurants[0].orders_count == 1
    assert len(result.top_items) == 1
    assert result.top_items[0].quantity == 2
    assert result.top_items[0].revenue == 500


async def test_get_finance_analytics_prev_window_growth(
    db_session: AsyncSession, finance_db: FinanceSeed
) -> None:
    now = finance_db.now
    result = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=14)).date(),
        date_to=now.date(),
    )
    assert result.revenue_growth_pct is not None
    assert result.revenue_growth_pct == 150.0


async def test_get_finance_analytics_growth_100_when_no_prev(
    db_session: AsyncSession, finance_db: FinanceSeed
) -> None:
    now = finance_db.now
    result = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=3)).date(),
        date_to=now.date(),
    )
    assert result.revenue_growth_pct == 100.0


async def test_get_finance_analytics_filter_by_vendor(
    db_session: AsyncSession, finance_db: FinanceSeed
) -> None:
    now = finance_db.now
    result = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=5)).date(),
        date_to=now.date(),
        vendor_id=finance_db.vendor_profile.id,
    )
    assert result.total_orders == 2

    empty = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=5)).date(),
        date_to=now.date(),
        vendor_id=uuid.uuid4(),
    )
    assert empty.total_orders == 0
    assert empty.conversion_percent == 0.0
    assert empty.revenue_growth_pct is None


async def test_get_finance_analytics_filter_by_restaurant(
    db_session: AsyncSession, finance_db: FinanceSeed
) -> None:
    now = finance_db.now
    result = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=5)).date(),
        date_to=now.date(),
        restaurant_id=finance_db.restaurant.id,
    )
    assert result.total_revenue == 500

    empty = await get_finance_analytics(
        db_session,
        date_from=(now - timedelta(days=5)).date(),
        date_to=now.date(),
        restaurant_id=uuid.uuid4(),
    )
    assert empty.total_orders == 0


@pytest.mark.usefixtures("finance_db")
@pytest.mark.usefixtures("finance_db")
async def test_get_finance_analytics_default_window(
    db_session: AsyncSession
) -> None:
    result = await get_finance_analytics(db_session)
    assert result.total_orders >= 2
    assert len(result.revenue_by_day) == 14
