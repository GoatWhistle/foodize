import uuid

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.menu.schemas import (
    AvailabilityUpdate,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
)
from features.menu.services import menu_items as service
from features.users.models import User
from features.vendors.dependencies import get_current_vendor
from features.vendors.models import VendorProfile
from infra.storage import MAX_IMAGE_BYTES
from shared.dependencies import require_permission
from shared.enums.permissions import Permission
from shared.exceptions import BadRequestException
from shared.response import build_list_response, build_response
from shared.restaurant_resolver import resolve_restaurant_uuid
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.post(
    "/{restaurant_id}/items",
    response_model=SuccessResponse[MenuItemResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_menu_item(
    restaurant_id: uuid.UUID,
    item_in: MenuItemCreate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemResponse]:
    result = await service.add_menu_item(
        session=session,
        restaurant_id=restaurant_id,
        item_data=item_in,
        vendor_id=current_vendor.id,
        actor_id=_user.id,
    )
    return build_response(result)


@router.patch("/{restaurant_id}/items/{item_id}", response_model=SuccessResponse[MenuItemResponse])
async def update_menu_item(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    item_in: MenuItemUpdate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemResponse]:
    result = await service.update_menu_item_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        item_data=item_in,
        vendor_id=current_vendor.id,
        actor_id=_user.id,
    )
    return build_response(result)


@router.post(
    "/{restaurant_id}/items/{item_id}/photo",
    response_model=SuccessResponse[MenuItemResponse],
)
async def upload_menu_item_photo(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    request: Request,
    file: UploadFile = File(...),
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemResponse]:
    content_length = request.headers.get("content-length")
    if (
        content_length is not None
        and content_length.isdigit()
        and int(content_length) > MAX_IMAGE_BYTES
    ):
        raise BadRequestException(detail="Файл слишком большой (максимум 5 МБ)")

    data = await file.read(MAX_IMAGE_BYTES + 1)
    if not data:
        raise BadRequestException(detail="Пустой файл")
    if len(data) > MAX_IMAGE_BYTES:
        raise BadRequestException(detail="Файл слишком большой (максимум 5 МБ)")

    result = await service.set_menu_item_photo(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        data=data,
        content_type=file.content_type or "",
        vendor_id=current_vendor.id,
        actor_id=_user.id,
    )
    return build_response(result)


@router.delete(
    "/{restaurant_id}/items/{item_id}/photo",
    response_model=SuccessResponse[MenuItemResponse],
)
async def delete_menu_item_photo(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemResponse]:
    result = await service.remove_menu_item_photo(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        vendor_id=current_vendor.id,
        actor_id=_user.id,
    )
    return build_response(result)


@router.delete("/{restaurant_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await service.delete_menu_item_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        vendor_id=current_vendor.id,
        actor_id=_user.id,
    )


@router.patch(
    "/{restaurant_id}/items/{item_id}/availability",
    response_model=SuccessResponse[MenuItemResponse],
)
async def toggle_item_availability(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    data: AvailabilityUpdate,
    _user: User = Depends(require_permission(Permission.MENU_MANAGE)),
    current_vendor: VendorProfile = Depends(get_current_vendor),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[MenuItemResponse]:
    result = await service.toggle_item_availability_for_vendor(
        session=session,
        restaurant_id=restaurant_id,
        item_id=item_id,
        is_available=data.is_available,
        vendor_id=current_vendor.id,
        actor_id=_user.id,
    )
    return build_response(result)


@router.get("/{restaurant_id}", response_model=SuccessListResponse[MenuItemResponse])
async def read_restaurant_menu(
    request: Request,
    restaurant_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[MenuItemResponse]:
    rid = await resolve_restaurant_uuid(session, restaurant_id)
    data, total = await service.get_menu(session, rid, page=page, size=size)
    return build_list_response(data=data, total=total, page=page, size=size, request=request)
