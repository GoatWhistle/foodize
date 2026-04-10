import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features import VendorProfile
from features.menu.schemas import MenuItemCreate, MenuItemResponse
from features.menu.service import add_item_to_menu_logic, get_restaurant_menu_logic
from features.vendors.dependencies import get_current_vendor

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.post(
    "/{restaurant_id}/items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED
)
async def create_menu_item(
    restaurant_id: uuid.UUID,
    item_in: MenuItemCreate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await add_item_to_menu_logic(
        session=session, restaurant_id=restaurant_id, item_data=item_in, vendor_id=current_vendor.id
    )


@router.get("/{restaurant_id}", response_model=list[MenuItemResponse])
async def get_menu(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await get_restaurant_menu_logic(session, restaurant_id)
