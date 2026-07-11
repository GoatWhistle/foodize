from database import db_helper
from seed.data import SEED_USERS
from seed.engagement import (
    seed_audit_log,
    seed_cancelled_orders,
    seed_extended_promos,
    seed_promo_order,
)
from seed.moderation import seed_moderation
from seed.notifications import seed_notifications
from seed.orders import (
    recalc_ratings,
    seed_favorites,
    seed_orders,
    seed_reviews,
)
from seed.restaurants import (
    seed_staff,
    seed_superuser,
    seed_vendors_and_restaurants,
)
from seed.special import promote_special_vendor
from seed.staff_requests import seed_staff_requests
from seed.superuser_full import seed_superuser_engagement
from seed.users import seed_users


def _print_credentials() -> None:
    print("\n" + "═" * 48)
    print("Done! Credentials:")
    print("═" * 48)
    for u in SEED_USERS:
        print(f"  [{u['role']:8}]  {u['phone_number']}  /  {u['password']}")
    print("═" * 48)


async def seed() -> None:
    print("Seeding demo data...\n")

    async with db_helper.session_factory() as session:
        created_users = await seed_users(session)
        all_restaurants, restaurant_items = await seed_vendors_and_restaurants(
            session, created_users
        )
        await seed_staff(session, created_users, all_restaurants)
        await seed_superuser(session, created_users, all_restaurants)
        placed_orders = await seed_orders(
            session, created_users, all_restaurants, restaurant_items
        )
        await seed_reviews(session, placed_orders)

        await seed_extended_promos(session, all_restaurants)
        await seed_cancelled_orders(
            session, created_users, all_restaurants, restaurant_items
        )
        await seed_promo_order(
            session, created_users, all_restaurants, restaurant_items
        )
        await seed_superuser_engagement(
            session, created_users, all_restaurants, restaurant_items
        )

        await recalc_ratings(session, all_restaurants)
        await seed_favorites(session, created_users, all_restaurants)

        await seed_moderation(session)
        await seed_staff_requests(session, all_restaurants)
        await seed_notifications(session, created_users)
        await seed_audit_log(session, created_users, all_restaurants)

        print("\n── Special vendor ──────────────────────")
        await promote_special_vendor(session)

    await db_helper.dispose()
    _print_credentials()
