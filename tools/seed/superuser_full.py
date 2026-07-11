import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.favorites.crud import create_favorite, get_favorite
from features.menu.models import MenuItem
from features.orders.crud.order import create_order_event
from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from features.reviews.crud import create_review, get_user_review_for_restaurant
from features.reviews.schemas import ReviewCreate
from features.users.models import User
from seed.common import get_or_load_user
from seed.data import SEED_USERS
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission

SUPERUSER_PHONE = next(
    (u["phone_number"] for u in SEED_USERS if u["role"] == "superuser"),
    "+70000000099",
)


def _other_restaurants(su_id, all_restaurants: list[Restaurant]) -> list[Restaurant]:
    return [r for r in all_restaurants if r.vendor_id != su_id]


async def _placed_completed_order(
    session: AsyncSession,
    su: User,
    restaurant: Restaurant,
    items: list[MenuItem],
) -> Order | None:
    existing = await session.execute(
        select(Order)
        .where(Order.user_id == su.id, Order.restaurant_id == restaurant.id)
        .limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        return None

    mi = random.choice(items)
    order = Order(
        user_id=su.id,
        restaurant_id=restaurant.id,
        total_price=mi.price,
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
    order.ready_at = datetime.now(timezone.utc) - timedelta(minutes=20)
    path = [
        OrderStatus.PENDING,
        OrderStatus.ACCEPTED,
        OrderStatus.READY,
        OrderStatus.COMPLETED,
    ]
    for old, new in zip(path, path[1:]):
        await create_order_event(
            session, order.id, su.id, [Permission.ORDERS_MANAGE_STATUS], old, new
        )
    await session.commit()
    return order


async def seed_superuser_engagement(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
    restaurant_items: dict[str, list[MenuItem]],
) -> None:
    print("\n── Superuser as customer ───────────────")
    su = await get_or_load_user(session, SUPERUSER_PHONE, created_users)
    if su is None or not all_restaurants:
        print("  skip (no superuser/restaurants)")
        return

    targets = _other_restaurants(su.id, all_restaurants)[:2]
    if not targets:
        targets = all_restaurants[:1]

    for restaurant in targets:
        items = restaurant_items.get(str(restaurant.id), [])
        if not items:
            continue

        order = await _placed_completed_order(session, su, restaurant, items)
        if order is not None:
            print(f"  order #{order.display_id} @ {restaurant.name}")

        if await get_favorite(session, su.id, restaurant.id) is None:
            await create_favorite(session, su.id, restaurant.id)
            print(f"  favorite → {restaurant.name}")

        if await get_user_review_for_restaurant(session, su.id, restaurant.id) is None:
            await create_review(
                session,
                ReviewCreate(rating=5, text="Как вендор и как клиент — рекомендую!"),
                user_id=su.id,
                restaurant_id=restaurant.id,
                is_verified_purchase=True,
            )
            print(f"  review ★5 → {restaurant.name}")
        await session.commit()
