import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.models import Restaurant
from features.restaurants.exceptions import RestaurantNotFoundException


async def resolve_restaurant_uuid(session: AsyncSession, identifier: str) -> uuid.UUID:
    if not identifier:
        raise RestaurantNotFoundException()
    try:
        return uuid.UUID(identifier)
    except (ValueError, TypeError):
        pass
    result = await session.execute(
        select(Restaurant.id).where(Restaurant.display_id == identifier)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise RestaurantNotFoundException()
    return row
