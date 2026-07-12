import uuid
from http import HTTPStatus

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.menu.schemas import (
    MenuItemOptionCreate,
    MenuItemOptionGroupCreate,
    MenuItemOptionGroupResponse,
    MenuItemOptionGroupUpdate,
    MenuItemOptionResponse,
    MenuItemOptionUpdate,
)
from features.menu.services import options as service
from features.users.models import User
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from shared.dependencies import require_permission
from shared.enums.permissions import Permission
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.post(
    "/{restaurant_id}/items/{item_id}/option-groups",
    response_model=SuccessResponse[MenuItemOptionGroupResponse],
    status_code=HTTPStatus.CREATED,
)
async def create_option_group(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_in: MenuItemOptionGroupCreate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemOptionGroupResponse]:
    result = await service.create_option_group_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        data=group_in,
        vendor_id=current_vendor.id,
    )
    return build_response(result)


@router.patch(
    "/{restaurant_id}/items/{item_id}/option-groups/{group_id}",
    response_model=SuccessResponse[MenuItemOptionGroupResponse],
)
async def update_option_group(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    group_in: MenuItemOptionGroupUpdate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemOptionGroupResponse]:
    result = await service.update_option_group_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        group_id=group_id,
        data=group_in,
        vendor_id=current_vendor.id,
    )
    return build_response(result)


@router.delete(
    "/{restaurant_id}/items/{item_id}/option-groups/{group_id}",
    status_code=HTTPStatus.NO_CONTENT,
)
async def delete_option_group(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await service.delete_option_group_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        group_id=group_id,
        vendor_id=current_vendor.id,
    )


@router.post(
    "/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options",
    response_model=SuccessResponse[MenuItemOptionResponse],
    status_code=HTTPStatus.CREATED,
)
async def create_option(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    option_in: MenuItemOptionCreate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemOptionResponse]:
    result = await service.create_option_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        group_id=group_id,
        data=option_in,
        vendor_id=current_vendor.id,
    )
    return build_response(result)


@router.patch(
    "/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}",
    response_model=SuccessResponse[MenuItemOptionResponse],
)
async def update_option(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    option_id: uuid.UUID,
    option_in: MenuItemOptionUpdate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemOptionResponse]:
    result = await service.update_option_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        group_id=group_id,
        option_id=option_id,
        data=option_in,
        vendor_id=current_vendor.id,
    )
    return build_response(result)


@router.delete(
    "/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}",
    status_code=HTTPStatus.NO_CONTENT,
)
async def delete_option(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    option_id: uuid.UUID,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await service.delete_option_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        group_id=group_id,
        option_id=option_id,
        vendor_id=current_vendor.id,
    )
