import uuid

from sqlalchemy import ColumnElement
from sqlalchemy.ext.asyncio import AsyncSession

from database.db_helper import register_after_commit
from features.restaurants import crud
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.models import Restaurant
from features.restaurants.schemas import (
    RestaurantCreate,
    RestaurantResponse,
    RestaurantUpdate,
)
from features.restaurants.working_hours import WorkingHours
from features.restaurants.working_hours_crud import get_working_hours, is_open_now
from features.vendors import crud as vendor_crud
from infra.storage import UnsupportedImageType, delete_image, upload_image
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.enums.restaurant_sort import RestaurantSort
from shared.enums.sort_direction import SortDirection
from shared.exceptions import BadRequestException
from shared.exceptions.rules import AccessDeniedException
from shared.permissions import has_permission


async def create_restaurant_for_vendor(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
) -> RestaurantResponse:
    vendor = await vendor_crud.get_vendor_by_id_with_user(session, vendor_id)
    if not vendor:
        raise AccessDeniedException()
    if vendor.approval_status != ModerationStatus.APPROVED.value:
        raise AccessDeniedException(detail="Vendor account is not approved yet")

    restaurant = await crud.create_restaurant(session, restaurant_data, vendor_id)
    if vendor and has_permission(vendor.user.permissions, Permission.RESTAURANTS_MODERATE):
        restaurant.moderation_status = ModerationStatus.APPROVED.value
        restaurant.rejection_reason = None
    await session.flush()
    await session.refresh(restaurant)
    return RestaurantResponse.model_validate(restaurant)


async def update_restaurant_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    update_data: RestaurantUpdate,
    vendor_id: uuid.UUID,
) -> RestaurantResponse:
    restaurant = await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    updated = await crud.update_restaurant(session, restaurant, update_data)
    await session.flush()
    return RestaurantResponse.model_validate(updated)


async def set_restaurant_photo(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    data: bytes,
    content_type: str,
    vendor_id: uuid.UUID,
) -> RestaurantResponse:
    restaurant = await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    old_url = restaurant.photo_url
    try:
        url = await upload_image(data, content_type, prefix="restaurants")
    except UnsupportedImageType as exc:
        raise BadRequestException(
            detail="Поддерживаются только изображения JPEG, PNG или WebP"
        ) from exc

    restaurant.photo_url = url
    await session.flush()

    if old_url and old_url != url:
        register_after_commit(session, lambda: delete_image(old_url))

    await session.refresh(restaurant)
    return RestaurantResponse.model_validate(restaurant)


async def remove_restaurant_photo(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> RestaurantResponse:
    restaurant = await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    old_url = restaurant.photo_url
    if old_url is None:
        return RestaurantResponse.model_validate(restaurant)

    restaurant.photo_url = None
    await session.flush()

    register_after_commit(session, lambda: delete_image(old_url))

    await session.refresh(restaurant)
    return RestaurantResponse.model_validate(restaurant)


async def get_my_restaurants(
    session: AsyncSession,
    vendor_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
) -> tuple[list[RestaurantResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_vendor_restaurants(session, vendor_id, offset=offset, limit=size)
    total = await crud.count_vendor_restaurants(session, vendor_id)
    return [RestaurantResponse.model_validate(r) for r in data], total


def _resolve_public_where_clause(identifier: str | uuid.UUID) -> ColumnElement[bool]:
    try:
        parsed_uuid = uuid.UUID(identifier) if isinstance(identifier, str) else identifier
        return Restaurant.id == parsed_uuid
    except ValueError:
        return Restaurant.display_id == str(identifier)


async def get_restaurant_public(
    session: AsyncSession,
    identifier: str | uuid.UUID,
) -> RestaurantResponse:
    where_clause = _resolve_public_where_clause(identifier)
    found = await crud.get_public_restaurant_with_popularity(session, where_clause)
    if found is None:
        raise RestaurantNotFoundException()
    restaurant, orders_count_7d = found
    response = RestaurantResponse.model_validate(restaurant)
    response.orders_count_7d = orders_count_7d

    if response.is_open:
        hours = await get_working_hours(session, response.id)
        if hours and is_open_now(hours) is False:
            response.is_open = False

    return response


def _overlay_open_status(
    responses: list[RestaurantResponse],
    working_hours_by_restaurant: dict[uuid.UUID, list[WorkingHours]],
) -> None:
    for response in responses:
        if not response.is_open:
            continue
        hours = working_hours_by_restaurant.get(response.id)
        if hours and is_open_now(hours) is False:
            response.is_open = False


async def get_all_restaurants_public(
    session: AsyncSession,
    name: str | None = None,
    is_hiring: bool | None = None,
    is_open: bool | None = None,
    sort: str = RestaurantSort.DEFAULT.value,
    direction: str = SortDirection.DESC.value,
    page: int = 1,
    size: int = 20,
) -> tuple[list[RestaurantResponse], int]:
    offset = (page - 1) * size
    rows = await crud.list_public_restaurants_with_popularity(
        session, name, is_hiring, is_open, sort, direction, offset, size
    )
    responses: list[RestaurantResponse] = []
    restaurant_ids: list[uuid.UUID] = []
    for restaurant, orders_count_7d in rows:
        restaurant_ids.append(restaurant.id)
        response = RestaurantResponse.model_validate(restaurant)
        response.orders_count_7d = orders_count_7d
        responses.append(response)

    if restaurant_ids:
        working_hours_by_restaurant = await crud.get_working_hours_for_restaurants(
            session, restaurant_ids
        )
        _overlay_open_status(responses, working_hours_by_restaurant)

    total = await crud.count_public_restaurants(session, name, is_hiring, is_open)
    return responses, total
