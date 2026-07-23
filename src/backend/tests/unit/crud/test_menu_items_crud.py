import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.menu.crud import (
    count_menu_items,
    create_menu_item,
    delete_menu_item,
    get_menu_item_by_id,
    get_menu_items,
    update_menu_item,
)
from features.menu.schemas import MenuItemCreate, MenuItemUpdate
from shared.exceptions.internal import PersistedEntityMissingError

from .menu_crud_helpers import make_menu_session


class TestGetMenuItemById:
    async def test_returns_none(self) -> None:
        session = make_menu_session()
        result = await get_menu_item_by_id(session, uuid.uuid4())
        assert result is None

    async def test_returns_item(self) -> None:
        session = make_menu_session()
        item = MagicMock()
        session.execute.return_value.scalar_one_or_none.return_value = item
        result = await get_menu_item_by_id(session, uuid.uuid4())
        assert result is item


class TestGetMenuItems:
    async def test_returns_list(self) -> None:
        session = make_menu_session()
        items = [MagicMock(), MagicMock()]
        session.execute.return_value.scalars.return_value.all.return_value = items
        result = await get_menu_items(session, uuid.uuid4())
        assert result == items

    async def test_empty_list(self) -> None:
        session = make_menu_session()
        result = await get_menu_items(session, uuid.uuid4())
        assert result == []


class TestCountMenuItems:
    async def test_returns_count(self) -> None:
        session = make_menu_session()
        session.execute.return_value.scalar_one.return_value = 5
        result = await count_menu_items(session, uuid.uuid4())
        assert result == 5


class TestCreateMenuItem:
    async def test_creates_and_returns(self) -> None:
        session = make_menu_session()
        restaurant_id = uuid.uuid4()
        item_id = uuid.uuid4()

        loaded_item = MagicMock()
        loaded_item.id = item_id
        session.execute.return_value.scalar_one_or_none.return_value = loaded_item

        item_data = MenuItemCreate(name="Бургер", price=250, category="BURGER")

        with patch(
            "features.menu.crud.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=loaded_item,
        ):
            result = await create_menu_item(session, item_data, restaurant_id)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()
        assert result is loaded_item

    async def test_raises_if_not_found_after_create(self) -> None:
        session = make_menu_session()
        item_data = MenuItemCreate(name="Бургер", price=250, category="BURGER")

        with (
            patch(
                "features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=None
            ),
            pytest.raises(PersistedEntityMissingError),
        ):
            await create_menu_item(session, item_data, uuid.uuid4())


class TestUpdateMenuItem:
    async def test_updates_fields(self) -> None:
        session = make_menu_session()
        item = MagicMock()
        item.id = uuid.uuid4()
        loaded = MagicMock()

        update_data = MenuItemUpdate(name="Новый бургер")
        with patch(
            "features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=loaded
        ):
            result = await update_menu_item(session, item, update_data)

        session.flush.assert_awaited_once()
        assert result is loaded

    async def test_raises_if_not_found_after_update(self) -> None:
        session = make_menu_session()
        item = MagicMock()
        item.id = uuid.uuid4()

        update_data = MenuItemUpdate(name="X")
        with (
            patch(
                "features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=None
            ),
            pytest.raises(PersistedEntityMissingError),
        ):
            await update_menu_item(session, item, update_data)


class TestDeleteMenuItem:
    async def test_marks_deleted(self) -> None:
        session = make_menu_session()
        item = MagicMock()
        await delete_menu_item(session, item)
        assert item.is_deleted is True
        session.flush.assert_awaited_once()
