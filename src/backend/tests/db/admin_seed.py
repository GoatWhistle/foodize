from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from features.orders.models import Order
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.reviews.models import Review
from features.users.crud import create_user
from features.users.models import User
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus
from shared.enums.order_status import OrderStatus
from shared.permissions import VENDOR_PERMISSIONS, serialize_permissions


@dataclass(frozen=True)
class AdminSeed:
    vendor_user: User
    vendor_profile: VendorProfile
    customer: User
    restaurant: Restaurant
    other_restaurant: Restaurant


async def seed_admin_crud_data(db_session: AsyncSession) -> AdminSeed:
    vendor_user = await create_user(
        db_session,
        UserCreate(name="Alice Vendor", phone_number="79009001001", password="strongpassword1"),
    )
    vendor_user.permissions = serialize_permissions(VENDOR_PERMISSIONS)
    vendor_profile = await create_vendor_profile(db_session, vendor_user)

    customer = await create_user(
        db_session,
        UserCreate(name="Bob Customer", phone_number="79009001002", password="strongpassword1"),
    )

    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Sushi Palace", address="Main St", is_open=True),
        vendor_profile.id,
    )
    restaurant.moderation_status = ModerationStatus.APPROVED.value

    other_restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Pizza Corner", address="Second St", is_open=False),
        vendor_profile.id,
    )
    other_restaurant.moderation_status = ModerationStatus.PENDING.value

    review = Review(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        rating=4,
        text="Great",
        is_verified_purchase=True,
    )
    db_session.add(review)

    completed = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=300,
        status=OrderStatus.COMPLETED.value,
    )
    pending = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=200,
        status=OrderStatus.PENDING.value,
    )
    db_session.add_all([completed, pending])
    await db_session.commit()

    return AdminSeed(
        vendor_user=vendor_user,
        vendor_profile=vendor_profile,
        customer=customer,
        restaurant=restaurant,
        other_restaurant=other_restaurant,
    )
