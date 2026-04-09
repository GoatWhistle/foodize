from sqlalchemy.ext.asyncio import AsyncSession

from features import Restaurant
from shared.exceptions import RuleException
from shared.exceptions.existence import NotFoundException


async def get_restaurant_and_check_ownership(
    session: AsyncSession, restaurant_id: int, vendor_id: int
):
    restaurant = await session.get(Restaurant, restaurant_id)

    if not restaurant:
        raise NotFoundException()

    if restaurant.vendor_id != vendor_id:
        raise RuleException()

    return restaurant
