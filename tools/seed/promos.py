import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.promos.crud import (
    create_promo,
    get_promo_by_code,
    increment_used_count,
    reserve_promo_usage,
)
from features.promos.models import Promo
from features.promos.schemas import PromoCreate
from features.restaurants.models import Restaurant
from features.users.models import User
from seed.common import get_or_load_user
from seed.fixtures.engagement import APPLIED_PROMO_CODE, EXTENDED_PROMOS
from seed.fixtures.users import SEED_USERS
from shared.enums.order_status import OrderStatus

EXPIRED_PROMO_AGE = timedelta(days=3)
PROMO_ORDER_READY_AGE = timedelta(minutes=10)
PERCENT_BASE = 100


async def _create_disabled_promo(
    session: AsyncSession, restaurant: Restaurant, promo_spec: dict[str, Any]
) -> None:
    promo = Promo(
        code=promo_spec["code"].upper(),
        discount_type=promo_spec["discount_type"],
        discount_value=promo_spec["discount_value"],
        restaurant_id=restaurant.id,
        max_uses=promo_spec.get("max_uses"),
        is_active=promo_spec.get("is_active", True),
    )
    if promo_spec.get("expired"):
        promo.expires_at = datetime.now(UTC) - EXPIRED_PROMO_AGE
    session.add(promo)
    await session.commit()


async def _create_active_promo(
    session: AsyncSession, restaurant: Restaurant, promo_spec: dict[str, Any]
) -> None:
    expires_at = None
    if promo_spec.get("future_days"):
        expires_at = datetime.now(UTC) + timedelta(
            days=promo_spec["future_days"]
        )
    await create_promo(
        session,
        PromoCreate(
            code=promo_spec["code"],
            discount_type=promo_spec["discount_type"],
            discount_value=promo_spec["discount_value"],
            restaurant_id=restaurant.id,
            max_uses=promo_spec.get("max_uses"),
            expires_at=expires_at,
            first_order_only=promo_spec.get("first_order_only", False),
            min_order_amount=promo_spec.get("min_order_amount"),
            menu_category=promo_spec.get("menu_category"),
        ),
    )


def _promo_flags(promo_spec: dict[str, Any]) -> list[str]:
    flags = []
    if promo_spec.get("first_order_only"):
        flags.append("first_order")
    if promo_spec.get("menu_category"):
        flags.append("category")
    if promo_spec.get("expired"):
        flags.append("expired")
    if promo_spec.get("is_active") is False:
        flags.append("inactive")
    return flags


async def seed_extended_promos(
    session: AsyncSession, all_restaurants: list[Restaurant]
) -> None:
    print("\n── Extended promos ─────────────────────")
    for promo_spec in EXTENDED_PROMOS:
        idx = promo_spec["restaurant_index"]
        if idx >= len(all_restaurants):
            continue
        restaurant = all_restaurants[idx]
        existing = await get_promo_by_code(session, promo_spec["code"])
        if existing is not None:
            print(f"  skip promo (exists): {promo_spec['code']}")
            continue

        if promo_spec.get("expired") or promo_spec.get("is_active") is False:
            await _create_disabled_promo(session, restaurant, promo_spec)
        else:
            await _create_active_promo(session, restaurant, promo_spec)
        flags = _promo_flags(promo_spec)
        suffix = f" ({', '.join(flags)})" if flags else ""
        print(f"  promo {promo_spec['code']}{suffix}")


async def _applied_promo_order_exists(
    session: AsyncSession, promo_id: uuid.UUID
) -> bool:
    result = await session.execute(
        select(Order).where(Order.promo_id == promo_id).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _place_promo_order(
    session: AsyncSession,
    customer: User,
    restaurant: Restaurant,
    promo: Promo,
    menu_item: MenuItem,
) -> tuple[Order, int]:
    subtotal = menu_item.price
    discount = subtotal * promo.discount_value // PERCENT_BASE
    order = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=max(subtotal - discount, 0),
        promo_id=promo.id,
    )
    session.add(order)
    await session.flush()
    session.add(
        OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=1,
            price_at_purchase=menu_item.price,
        )
    )
    order.status = OrderStatus.COMPLETED.value
    order.ready_at = datetime.now(UTC) - PROMO_ORDER_READY_AGE
    await reserve_promo_usage(session, promo.id, customer.id)
    await increment_used_count(session, promo)
    await session.commit()
    return order, discount


async def seed_promo_order(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
    restaurant_items: dict[str, list[MenuItem]],
) -> None:
    print("\n── Applied promo order ─────────────────")
    promo = await get_promo_by_code(session, APPLIED_PROMO_CODE)
    if promo is None:
        print(f"  skip (no promo {APPLIED_PROMO_CODE})")
        return
    if await _applied_promo_order_exists(session, promo.id):
        print("  skip (exists)")
        return

    restaurant = next(
        (r for r in all_restaurants if r.id == promo.restaurant_id), None
    )
    if restaurant is None:
        print("  skip (restaurant not seeded)")
        return
    items = restaurant_items.get(str(restaurant.id), [])
    if not items:
        print("  skip (no items)")
        return

    customer_phones = [u["phone_number"] for u in SEED_USERS if u["role"] == "customer"]
    customer = await get_or_load_user(session, customer_phones[-1], created_users)
    if customer is None:
        return

    order, discount = await _place_promo_order(
        session, customer, restaurant, promo, items[0]
    )
    print(
        f"  order #{order.display_id} with {promo.code} "
        f"(-{discount}₽) @ {restaurant.name}"
    )
