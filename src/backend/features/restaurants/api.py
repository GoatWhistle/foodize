import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import db_helper
from features import VendorProfile
from features.restaurants.schemas import RestaurantCreate, RestaurantResponse, RestaurantUpdate
from features.restaurants.service import (
    get_my_restaurants,
    register_new_restaurant,
    update_restaurant_logic,
)
from features.vendors.dependencies import get_current_vendor
router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
@router.post("/", response_model=RestaurantResponse)
async def create_restaurant(
    restaurant_in: RestaurantCreate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await register_new_restaurant(
        session=session, restaurant_data=restaurant_in, vendor_id=current_vendor.id
    )
@router.patch("/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(
    restaurant_id: uuid.UUID,
    update_in: RestaurantUpdate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await update_restaurant_logic(
        session=session,
        restaurant_id=restaurant_id,
        update_data=update_in,
        vendor_id=current_vendor.id,
    )
@router.get("/", response_model=list[RestaurantResponse])
async def get_restaurants(
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await get_my_restaurants(session=session, vendor_id=current_vendor.id)
