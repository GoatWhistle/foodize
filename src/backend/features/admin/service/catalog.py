import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.schemas import (
    AdminRestaurantResponse,
    AdminReviewResponse,
    AdminVendorResponse,
)
from features.orders.models import Order
from shared.enums.order_status import OrderStatus
from shared.exceptions import NotFoundException


async def get_orders_list(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Order], int]:
    orders = await crud.get_all_orders(
        session,
        status=status,
        restaurant_id=restaurant_id,
        user_id=user_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=limit,
    )
    total = await crud.count_all_orders(
        session,
        status=status,
        restaurant_id=restaurant_id,
        user_id=user_id,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )
    return orders, total


async def get_restaurants_list(
    session: AsyncSession,
    search: str | None = None,
    vendor_search: str | None = None,
    is_open: bool | None = None,
    moderation_status: str | None = None,
    min_rating: float | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[AdminRestaurantResponse], int]:
    restaurants = await crud.get_all_restaurants(
        session,
        search=search,
        vendor_search=vendor_search,
        is_open=is_open,
        moderation_status=moderation_status,
        min_rating=min_rating,
        offset=offset,
        limit=limit,
    )
    total = await crud.count_all_restaurants(
        session,
        search=search,
        vendor_search=vendor_search,
        is_open=is_open,
        moderation_status=moderation_status,
        min_rating=min_rating,
    )
    return restaurants, total


async def get_restaurant_or_404(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> AdminRestaurantResponse:
    restaurant = await crud.get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise NotFoundException()
    return restaurant


async def delete_restaurant_service(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> AdminRestaurantResponse:
    restaurant = await get_restaurant_or_404(session, restaurant_id)
    await crud.deactivate_restaurant(session, restaurant_id)
    return restaurant


async def get_vendors_list(
    session: AsyncSession,
    search: str | None = None,
    approval_status: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[AdminVendorResponse], int]:
    vendors = await crud.get_all_vendors(
        session,
        search=search,
        approval_status=approval_status,
        offset=offset,
        limit=limit,
    )
    total = await crud.count_all_vendors(session, search=search, approval_status=approval_status)
    return [AdminVendorResponse.model_validate(vendor) for vendor in vendors], total


async def get_vendor_or_404(session: AsyncSession, vendor_id: uuid.UUID) -> AdminVendorResponse:
    vendor = await crud.get_vendor_by_id(session, vendor_id)
    if not vendor:
        raise NotFoundException()
    return AdminVendorResponse.model_validate(vendor)


async def delete_vendor_service(session: AsyncSession, vendor_id: uuid.UUID) -> AdminVendorResponse:
    vendor = await crud.get_vendor_by_id(session, vendor_id)
    if not vendor:
        raise NotFoundException()
    response = AdminVendorResponse.model_validate(vendor)
    await crud.deactivate_vendor(session, vendor)
    return response


async def get_reviews_list(
    session: AsyncSession,
    rating: int | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[AdminReviewResponse], int]:
    reviews = await crud.get_all_reviews(session, rating=rating, offset=offset, limit=limit)
    total = await crud.count_all_reviews(session, rating=rating)
    return reviews, total


async def delete_review_service(session: AsyncSession, review_id: uuid.UUID) -> AdminReviewResponse:
    review = await crud.get_review_by_id(session, review_id)
    if not review:
        raise NotFoundException()
    deleted = await crud.delete_review(session, review)
    return AdminReviewResponse.model_validate(deleted)
