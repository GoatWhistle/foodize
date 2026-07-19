import random
import uuid
from datetime import UTC, datetime, timedelta
from itertools import pairwise

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.favorites.crud import create_favorite, get_favorite
from features.menu.crud import get_menu_item_by_id
from features.menu.models import MenuItem
from features.orders.crud.order import create_order_event
from features.orders.models import Order, OrderItem, OrderItemOption
from features.restaurants.models import Restaurant
from features.reviews.crud import create_review, get_restaurant_avg_rating
from features.reviews.models import Review
from features.reviews.schemas import ReviewCreate
from features.users.models import User
from seed.common import get_or_load_user
from seed.fixtures.engagement import REVIEW_TEXTS
from seed.fixtures.users import SEED_USERS
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission

PlacedOrder = tuple[Order, User, Restaurant]

STATUS_PATH = [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.READY,
    OrderStatus.COMPLETED,
]

ORDER_STATUS_CYCLE = [
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.READY,
    OrderStatus.ACCEPTED,
    OrderStatus.PENDING,
]


async def _add_order_item(
    session: AsyncSession, order: Order, mi: MenuItem
) -> int:
    qty = random.randint(1, 2)
    order_item = OrderItem(
        order_id=order.id,
        menu_item_id=mi.id,
        quantity=qty,
        price_at_purchase=mi.price,
    )
    session.add(order_item)
    await session.flush()
    item_total = mi.price * qty

    full_item = await get_menu_item_by_id(session, mi.id)
    if full_item is not None and full_item.option_groups:
        for group in full_item.option_groups:
            if group.is_active is False:
                continue
            available_options = [
                option
                for option in group.options
                if option.is_available is not False
            ]
            if not available_options:
                continue
            if group.is_required or random.random() < 0.6:
                selected_option = random.choice(available_options)
                session.add(
                    OrderItemOption(
                        order_item_id=order_item.id,
                        option_id=selected_option.id,
                        name_snapshot=selected_option.name,
                        price_delta_snapshot=selected_option.price_delta,
                    )
                )
                item_total += selected_option.price_delta * qty
    return item_total


def _apply_order_status(order: Order, target_status: OrderStatus) -> None:
    if target_status == OrderStatus.PENDING:
        order.status = OrderStatus.PENDING.value
    else:
        for step in STATUS_PATH[1:]:
            order.status = step.value
            if step == target_status:
                break
    if target_status == OrderStatus.COMPLETED:
        order.ready_at = datetime.now(UTC) - timedelta(
            minutes=random.randint(5, 30)
        )


async def _place_order(
    session: AsyncSession,
    customer: User,
    restaurant: Restaurant,
    items: list[MenuItem],
    target_status: OrderStatus,
) -> Order:
    selected = random.sample(items, k=min(2, len(items)))
    order = Order(user_id=customer.id, restaurant_id=restaurant.id, total_price=0)
    session.add(order)
    await session.flush()

    for mi in selected:
        order.total_price += await _add_order_item(session, order, mi)

    _apply_order_status(order, target_status)
    await _record_status_history(session, order, customer, target_status)
    await session.commit()
    await session.refresh(order)
    return order


async def _record_status_history(
    session: AsyncSession,
    order: Order,
    customer: User,
    target_status: OrderStatus,
) -> None:
    if target_status == OrderStatus.PENDING:
        return
    reached = STATUS_PATH[: STATUS_PATH.index(target_status) + 1]
    for old, new in pairwise(reached):
        await create_order_event(
            session,
            order.id,
            customer.id,
            [Permission.ORDERS_MANAGE_STATUS],
            old,
            new,
        )


async def _order_exists(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> bool:
    result = await session.execute(
        select(Order)
        .where(Order.user_id == user_id, Order.restaurant_id == restaurant_id)
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def seed_orders(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
    restaurant_items: dict[str, list[MenuItem]],
) -> list[PlacedOrder]:
    print("\n── Orders ──────────────────────────────")
    customer_phones = [u["phone_number"] for u in SEED_USERS if u["role"] == "customer"]
    all_placed_orders: list[PlacedOrder] = []

    for restaurant in all_restaurants:
        items = restaurant_items.get(str(restaurant.id), [])
        if not items:
            continue

        for idx, phone in enumerate(customer_phones):
            customer = await get_or_load_user(session, phone, created_users)
            if not customer:
                continue

            if await _order_exists(session, customer.id, restaurant.id):
                print(f"  skip order (exists): {customer.name} @ {restaurant.name}")
                continue

            target_status = ORDER_STATUS_CYCLE[idx % len(ORDER_STATUS_CYCLE)]
            order = await _place_order(
                session, customer, restaurant, items, target_status
            )
            all_placed_orders.append((order, customer, restaurant))
            print(
                f"  order #{order.display_id} [{order.status}]: "
                f"{customer.name} @ {restaurant.name}"
            )

    return all_placed_orders


async def seed_reviews(
    session: AsyncSession, all_placed_orders: list[PlacedOrder]
) -> None:
    print("\n── Reviews ─────────────────────────────")
    completed_orders = [
        (o, u, r)
        for o, u, r in all_placed_orders
        if o.status == OrderStatus.COMPLETED.value
    ]
    review_pool = list(REVIEW_TEXTS)
    random.shuffle(review_pool)

    for i, (_order, customer, restaurant) in enumerate(completed_orders):
        result = await session.execute(
            select(Review).where(
                Review.user_id == customer.id,
                Review.restaurant_id == restaurant.id,
            )
        )
        if result.scalar_one_or_none():
            print(f"  skip review (exists): {customer.name} @ {restaurant.name}")
            continue

        rating, text = review_pool[i % len(review_pool)]
        await create_review(
            session,
            ReviewCreate(rating=rating, text=text),
            user_id=customer.id,
            restaurant_id=restaurant.id,
            is_verified_purchase=True,
        )
        print(f"  review ★{rating}: {customer.name} @ {restaurant.name}")


async def recalc_ratings(
    session: AsyncSession, all_restaurants: list[Restaurant]
) -> None:
    print("\n── Ratings recalc ──────────────────────")
    for restaurant in all_restaurants:
        avg, count = await get_restaurant_avg_rating(session, restaurant.id)
        restaurant.average_rating = avg or 0.0
        restaurant.review_count = count
        session.add(restaurant)
    await session.commit()
    print(f"  updated {len(all_restaurants)} restaurants")


async def seed_favorites(
    session: AsyncSession,
    created_users: dict[str, User],
    all_restaurants: list[Restaurant],
) -> None:
    print("\n── Favorites ───────────────────────────")
    customer_phones = [u["phone_number"] for u in SEED_USERS if u["role"] == "customer"]
    fav_assignments = [
        (customer_phones[0], [0, 2]),
        (customer_phones[1], [1, 3]),
        (customer_phones[2], [0, 1, 2]),
    ]
    for phone, indices in fav_assignments:
        customer = await get_or_load_user(session, phone, created_users)
        if not customer:
            continue
        for idx in indices:
            if idx >= len(all_restaurants):
                continue
            restaurant = all_restaurants[idx]
            existing = await get_favorite(session, customer.id, restaurant.id)
            if existing is None:
                await create_favorite(session, customer.id, restaurant.id)
                print(f"  fav: {customer.name} → {restaurant.name}")
            else:
                print("  skip fav (exists)")
