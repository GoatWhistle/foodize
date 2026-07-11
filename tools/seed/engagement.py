import random
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log.service import log_action
from features.menu.models import MenuItem
from features.orders.crud.order import create_order_event
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
from seed.data import (
    APPLIED_PROMO_CODE,
    EXTENDED_PROMOS,
    SEED_USERS,
)
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission


async def seed_extended_promos(
    session: AsyncSession, all_restaurants: list[Restaurant]
) -> None:
    print("\n── Extended promos ─────────────────────")
    for data in EXTENDED_PROMOS:
        idx = data["restaurant_index"]
        if idx >= len(all_restaurants):
            continue
        restaurant = all_restaurants[idx]
        existing = await get_promo_by_code(session, data["code"])
        if existing is not None:
            print(f"  skip promo (exists): {data['code']}")
            continue

        if data.get("expired") or data.get("is_active") is False:
            promo = Promo(
                code=data["code"].upper(),
                discount_type=data["discount_type"],
                discount_value=data["discount_value"],
                restaurant_id=restaurant.id,
                max_uses=data.get("max_uses"),
                is_active=data.get("is_active", True),
            )
            if data.get("expired"):
                promo.expires_at = datetime.now(timezone.utc) - timedelta(days=3)
            session.add(promo)
            await session.commit()
        else:
            expires_at = None
            if data.get("future_days"):
                expires_at = datetime.now(timezone.utc) + timedelta(
                    days=data["future_days"]
                )
            await create_promo(
                session,
                PromoCreate(
                    code=data["code"],
                    discount_type=data["discount_type"],
                    discount_value=data["discount_value"],
                    restaurant_id=restaurant.id,
                    max_uses=data.get("max_uses"),
                    expires_at=expires_at,
                    first_order_only=data.get("first_order_only", False),
                    min_order_amount=data.get("min_order_amount"),
                    menu_category=data.get("menu_category"),
                ),
            )
        flags = []
        if data.get("first_order_only"):
            flags.append("first_order")
        if data.get("menu_category"):
            flags.append("category")
        if data.get("expired"):
            flags.append("expired")
        if data.get("is_active") is False:
            flags.append("inactive")
        suffix = f" ({', '.join(flags)})" if flags else ""
        print(f"  promo {data['code']}{suffix}")


async def _cancelled_order_exists(session: AsyncSession, restaurant_id) -> bool:
    result = await session.execute(
        select(Order)
        .where(
            Order.restaurant_id == restaurant_id,
            Order.status == OrderStatus.CANCELLED.value,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def seed_cancelled_orders(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
    restaurant_items: dict[str, list[MenuItem]],
) -> None:
    print("\n── Cancelled orders ────────────────────")
    customer_phones = [u["phone_number"] for u in SEED_USERS if u["role"] == "customer"]
    if not (customer_phones and all_restaurants):
        return

    for restaurant in all_restaurants[:2]:
        items = restaurant_items.get(str(restaurant.id), [])
        if not items:
            continue
        if await _cancelled_order_exists(session, restaurant.id):
            print(f"  skip (exists): {restaurant.name}")
            continue

        customer = await get_or_load_user(session, customer_phones[0], created_users)
        if customer is None:
            continue

        mi = random.choice(items)
        order = Order(
            user_id=customer.id,
            restaurant_id=restaurant.id,
            total_price=mi.price,
            comment="Передумал, отменяю заказ.",
        )
        session.add(order)
        await session.flush()
        session.add(
            OrderItem(
                order_id=order.id,
                menu_item_id=mi.id,
                quantity=1,
                price_at_purchase=mi.price,
            )
        )
        await session.flush()

        await create_order_event(
            session,
            order.id,
            customer.id,
            [Permission.ORDERS_CREATE],
            OrderStatus.PENDING,
            OrderStatus.PENDING,
        )
        order.status = OrderStatus.CANCELLED.value
        order.cancellation_reason = "Отменён клиентом до принятия."
        await create_order_event(
            session,
            order.id,
            customer.id,
            [Permission.ORDERS_CREATE],
            OrderStatus.PENDING,
            OrderStatus.CANCELLED,
        )
        await session.commit()
        print(f"  cancelled order #{order.display_id} @ {restaurant.name}")


async def _applied_promo_order_exists(session: AsyncSession, promo_id) -> bool:
    result = await session.execute(
        select(Order).where(Order.promo_id == promo_id).limit(1)
    )
    return result.scalar_one_or_none() is not None


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

    mi = items[0]
    subtotal = mi.price
    discount = subtotal * promo.discount_value // 100
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
            menu_item_id=mi.id,
            quantity=1,
            price_at_purchase=mi.price,
        )
    )
    order.status = OrderStatus.COMPLETED.value
    order.ready_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    await reserve_promo_usage(session, promo.id, customer.id)
    await increment_used_count(session, promo)
    await session.commit()
    print(
        f"  order #{order.display_id} with {promo.code} "
        f"(-{discount}₽) @ {restaurant.name}"
    )


async def seed_audit_log(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
) -> None:
    print("\n── Audit log ───────────────────────────")
    admin = await get_or_load_user(session, "+70000000001", created_users)
    if admin is None or not all_restaurants:
        print("  skip (no admin/restaurants)")
        return

    entries: list[dict[str, Any]] = [
        {
            "action": "APPROVE_RESTAURANT",
            "entity_type": "restaurant",
            "entity_id": all_restaurants[0].id,
            "details": {"name": all_restaurants[0].name},
        },
        {
            "action": "APPROVE_VENDOR",
            "entity_type": "vendor",
            "entity_id": None,
            "details": {"note": "Одобрено при сидировании"},
        },
        {
            "action": "CREATE_PROMO",
            "entity_type": "promo",
            "entity_id": None,
            "details": {"code": APPLIED_PROMO_CODE},
        },
    ]
    for entry in entries:
        await log_action(
            session,
            actor_id=admin.id,
            action=entry["action"],
            entity_type=entry["entity_type"],
            entity_id=entry["entity_id"],
            details=entry["details"],
        )
    await session.commit()
    print(f"  +{len(entries)} audit entries")
