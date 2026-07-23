import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.loyalty.schemas import LoyaltyProgramUpsert, LoyaltyTierInput
from features.menu.crud import create_menu_item
from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate
from features.orders.crud.order import get_order_by_id
from features.orders.schemas.order import OrderCreate, OrderStatusUpdate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import change_order_status, place_order
from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.models import User
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from shared.enums.category import Category
from shared.enums.loyalty import LoyaltyProgramType, LoyaltyRewardType, LoyaltyTierBasis
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


async def seed_loyalty(db_session: AsyncSession) -> tuple[User, User, Restaurant, MenuItem]:
    vendor_user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79990003000",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor_profile = await create_vendor_profile(db_session, vendor_user)
    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Loyalty Restaurant", address="7 Loyalty St", is_open=True),
        vendor_profile.id,
    )
    menu_item = await create_menu_item(
        db_session,
        MenuItemCreate(name="Shawarma", price=300, category=Category.SHAURMA),
        restaurant.id,
    )
    customer = await create_user(
        db_session,
        UserCreate(name="Customer", phone_number="79990003001", password="strongpassword1"),
    )
    return vendor_user, customer, restaurant, menu_item


def punch_upsert(**overrides: object) -> LoyaltyProgramUpsert:
    data: dict[str, object] = {
        "type": LoyaltyProgramType.PUNCH_CARD,
        "punches_required": 2,
        "reward_type": LoyaltyRewardType.DISCOUNT_FIXED,
        "reward_value": 100,
    }
    data.update(overrides)
    return LoyaltyProgramUpsert.model_validate(data)


def cashback_upsert(**overrides: object) -> LoyaltyProgramUpsert:
    data: dict[str, object] = {
        "type": LoyaltyProgramType.CASHBACK,
        "tier_basis": LoyaltyTierBasis.ORDERS,
        "max_redeem_percent": 50,
        "tiers": [
            LoyaltyTierInput(name="Base", threshold=0, cashback_percent=5),
            LoyaltyTierInput(name="Fan", threshold=2, cashback_percent=10),
        ],
    }
    data.update(overrides)
    return LoyaltyProgramUpsert.model_validate(data)


async def place_loyalty_order(
    db_session: AsyncSession,
    restaurant: Restaurant,
    menu_item: MenuItem,
    customer_id: uuid.UUID,
    *,
    redeem_points: int = 0,
    loyalty_reward_id: uuid.UUID | None = None,
) -> uuid.UUID:
    order = await place_order(
        db_session,
        OrderCreate(
            restaurant_id=restaurant.id,
            items=[OrderItemCreate(menu_item_id=menu_item.id, quantity=1)],
            redeem_points=redeem_points,
            loyalty_reward_id=loyalty_reward_id,
        ),
        customer_id,
    )
    return order.id


async def complete_loyalty_order(
    db_session: AsyncSession, order_id: uuid.UUID, actor: User
) -> None:
    for update in (
        OrderStatusUpdate(status=OrderStatus.ACCEPTED, estimated_ready_in_minutes=15),
        OrderStatusUpdate(status=OrderStatus.READY),
        OrderStatusUpdate(status=OrderStatus.COMPLETED),
    ):
        order = await get_order_by_id(db_session, order_id)
        assert order is not None
        await change_order_status(db_session, order, update, actor)
