import uuid
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from database.db_helper import register_after_commit
from features.admin.audit_log import service as audit_service
from features.menu import crud
from features.menu.exceptions import (
    MenuItemNotFoundException,
    UnsupportedMenuImageTypeException,
)
from features.menu.schemas import (
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
)
from features.menu.services.shared import get_owned_menu_item
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from infra.storage import UnsupportedImageType, delete_image, upload_image

if TYPE_CHECKING:
    from features.admin.audit_log.schemas import AuditDetails


async def add_menu_item(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_data: MenuItemCreate,
    vendor_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> MenuItemResponse:
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await crud.create_menu_item(session, item_data, restaurant_id)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="CREATE_MENU_ITEM",
        entity_type="menu_item",
        entity_id=item.id,
        details={"restaurant_id": str(restaurant_id), "name": item.name},
    )
    await session.flush()
    return MenuItemResponse.model_validate(item)


async def get_menu(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    page: int = 1,
    size: int = 50,
) -> tuple[list[MenuItemResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_menu_items(session, restaurant_id, offset=offset, limit=size)
    total = await crud.count_menu_items(session, restaurant_id)
    return [MenuItemResponse.model_validate(i) for i in data], total


async def update_menu_item_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    item_data: MenuItemUpdate,
    vendor_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> MenuItemResponse:
    item = await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    old_data: AuditDetails = {
        "name": item.name,
        "price": item.price,
        "is_available": item.is_available,
    }
    updated = await crud.update_menu_item(session, item, item_data)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="UPDATE_MENU_ITEM",
        entity_type="menu_item",
        entity_id=updated.id,
        details={"old": old_data, "new": item_data.model_dump(exclude_unset=True)},
    )
    await session.flush()
    return MenuItemResponse.model_validate(updated)


async def delete_menu_item_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> None:
    item = await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    await crud.delete_menu_item(session, item)

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="DELETE_MENU_ITEM",
        entity_type="menu_item",
        entity_id=item_id,
        details={"restaurant_id": str(restaurant_id), "name": item.name},
    )
    await session.flush()


async def set_menu_item_photo(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    data: bytes,
    content_type: str,
    vendor_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> MenuItemResponse:
    item = await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    old_url = item.photo_url
    try:
        url = await upload_image(data, content_type, prefix="menu")
    except UnsupportedImageType as exc:
        raise UnsupportedMenuImageTypeException() from exc

    item.photo_url = url
    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="UPDATE_MENU_ITEM_PHOTO",
        entity_type="menu_item",
        entity_id=item.id,
        details={"restaurant_id": str(restaurant_id)},
    )
    await session.flush()

    if old_url and old_url != url:
        register_after_commit(session, lambda: delete_image(old_url))

    loaded = await crud.get_menu_item_by_id(session, item.id)
    if loaded is None:
        raise MenuItemNotFoundException()
    return MenuItemResponse.model_validate(loaded)


async def remove_menu_item_photo(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> MenuItemResponse:
    item = await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    old_url = item.photo_url
    if old_url is None:
        return MenuItemResponse.model_validate(item)

    item.photo_url = None
    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="DELETE_MENU_ITEM_PHOTO",
        entity_type="menu_item",
        entity_id=item.id,
        details={"restaurant_id": str(restaurant_id)},
    )
    await session.flush()

    register_after_commit(session, lambda: delete_image(old_url))

    loaded = await crud.get_menu_item_by_id(session, item.id)
    if loaded is None:
        raise MenuItemNotFoundException()
    return MenuItemResponse.model_validate(loaded)


async def toggle_item_availability_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    is_available: bool,
    vendor_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> MenuItemResponse:
    item = await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    item.is_available = is_available

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="TOGGLE_MENU_ITEM",
        entity_type="menu_item",
        entity_id=item_id,
        details={"is_available": is_available, "restaurant_id": str(restaurant_id)},
    )
    await session.flush()

    loaded = await crud.get_menu_item_by_id(session, item.id)
    if loaded is None:
        raise MenuItemNotFoundException()
    return MenuItemResponse.model_validate(loaded)


async def toggle_item_availability_for_staff(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    is_available: bool,
) -> MenuItemResponse:
    item = await crud.get_menu_item_by_id(session, item_id)
    if not item or item.restaurant_id != restaurant_id or item.is_deleted:
        raise MenuItemNotFoundException()
    item.is_available = is_available
    await session.flush()
    loaded = await crud.get_menu_item_by_id(session, item.id)
    return MenuItemResponse.model_validate(loaded)
