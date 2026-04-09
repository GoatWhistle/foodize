from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features import VendorProfile
from features.restaurants.schemas import RestaurantCreate, RestaurantResponse
from features.restaurants.service import register_new_restaurant
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
