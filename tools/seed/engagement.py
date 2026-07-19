import random
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log.service import log_action
from features.menu.models import MenuItem
from features.orders.crud.order import create_order_event
from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from features.users.models import User
from seed.common import get_or_load_user
from seed.fixtures.engagement import APPLIED_PROMO_CODE
from seed.fixtures.users import SEED_USERS
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission

ADMIN_PHONE = next(
    (u["phone_number"] for u in SEED_USERS if u["role"] == "admin"),
    "+70000000001",
)


async def _cancelled_order_exists(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> bool:
    result = await session.execute(
        select(Order)
        .where(
            Order.restaurant_id == restaurant_id,
            Order.status == OrderStatus.CANCELLED.value,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _create_cancelled_order(
    session: AsyncSession,
    customer: User,
    restaurant: Restaurant,
    menu_item: MenuItem,
) -> Order:
    order = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=menu_item.price,
        comment="Передумал, отменяю заказ.",
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
    return order


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

        order = await _create_cancelled_order(
            session, customer, restaurant, random.choice(items)
        )
        print(f"  cancelled order #{order.display_id} @ {restaurant.name}")


async def seed_audit_log(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
) -> None:
    print("\n── Audit log ───────────────────────────")
    admin = await get_or_load_user(session, ADMIN_PHONE, created_users)
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
