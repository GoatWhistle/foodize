import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.restaurants import service
from features.restaurants.schemas import RestaurantCreate, RestaurantResponse, RestaurantUpdate
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/public/{restaurant_id}", response_model=SuccessResponse[RestaurantResponse])
async def read_public_restaurant(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[RestaurantResponse]:
    result = await service.get_restaurant_public(session=session, restaurant_id=restaurant_id)
    return build_response(result)


@router.get("/public", response_model=SuccessListResponse[RestaurantResponse])
async def read_public_restaurants(
    request: Request,
    name: str | None = Query(None),
    is_hiring: bool | None = Query(None),
    is_open: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[RestaurantResponse]:
    data, total = await service.get_all_restaurants_public(
        session=session, name=name, is_hiring=is_hiring, is_open=is_open, page=page, size=size
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.post("/", response_model=SuccessResponse[RestaurantResponse])
async def create_restaurant(
    restaurant_in: RestaurantCreate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[RestaurantResponse]:
    result = await service.create_restaurant_for_vendor(
        session=session, restaurant_data=restaurant_in, vendor_id=current_vendor.id
    )
    return build_response(result)


@router.patch("/{restaurant_id}", response_model=SuccessResponse[RestaurantResponse])
async def update_restaurant(
    restaurant_id: uuid.UUID,
    update_in: RestaurantUpdate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[RestaurantResponse]:
    result = await service.update_restaurant_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        update_data=update_in,
        vendor_id=current_vendor.id,
    )
    return build_response(result)


@router.get("/", response_model=SuccessListResponse[RestaurantResponse])
async def read_my_restaurants(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[RestaurantResponse]:
    data, total = await service.get_my_restaurants(
        session=session, vendor_id=current_vendor.id, page=page, size=size
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)
