import uuid
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.menu import service
from features.menu.schemas import MenuItemCreate, MenuItemResponse, MenuItemUpdate
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile

if TYPE_CHECKING:
    from features.menu.models import MenuItem

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.post(
    "/{restaurant_id}/items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED
)
async def create_menu_item(
    restaurant_id: uuid.UUID,
    item_in: MenuItemCreate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> "MenuItem":
    return await service.add_menu_item(
        session=session, restaurant_id=restaurant_id, item_data=item_in, vendor_id=current_vendor.id
    )


@router.patch("/{restaurant_id}/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    item_in: MenuItemUpdate,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> "MenuItem":
    return await service.update_menu_item_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        item_data=item_in,
        vendor_id=current_vendor.id,
    )


@router.delete("/{restaurant_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await service.delete_menu_item_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        vendor_id=current_vendor.id,
    )


@router.get("/{restaurant_id}", response_model=list[MenuItemResponse])
async def read_restaurant_menu(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> list["MenuItem"]:
    return await service.get_menu(session, restaurant_id)
