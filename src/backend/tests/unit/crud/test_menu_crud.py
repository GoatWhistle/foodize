import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.menu.crud import (
    count_menu_items,
    create_menu_item,
    create_option,
    create_option_group,
    delete_menu_item,
    delete_option,
    delete_option_group,
    get_menu_item_by_id,
    get_menu_items,
    get_option_by_id,
    get_option_group_by_id,
    update_menu_item,
    update_option,
    update_option_group,
)
from features.menu.schemas import (
    MenuItemCreate,
    MenuItemOptionCreate,
    MenuItemOptionGroupCreate,
    MenuItemOptionGroupUpdate,
    MenuItemOptionUpdate,
    MenuItemUpdate,
)
from shared.enums.selection_type import SelectionType


def _make_session():
    session = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    result.scalar_one.return_value = 0
    result.scalars.return_value.all.return_value = []
    session.execute = AsyncMock(return_value=result)
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    return session


class TestGetMenuItemById:
    @pytest.mark.asyncio
    async def test_returns_none(self):
        session = _make_session()
        result = await get_menu_item_by_id(session, uuid.uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_item(self):
        session = _make_session()
        item = MagicMock()
        session.execute.return_value.scalar_one_or_none.return_value = item
        result = await get_menu_item_by_id(session, uuid.uuid4())
        assert result is item


class TestGetMenuItems:
    @pytest.mark.asyncio
    async def test_returns_list(self):
        session = _make_session()
        items = [MagicMock(), MagicMock()]
        session.execute.return_value.scalars.return_value.all.return_value = items
        result = await get_menu_items(session, uuid.uuid4())
        assert result == items

    @pytest.mark.asyncio
    async def test_empty_list(self):
        session = _make_session()
        result = await get_menu_items(session, uuid.uuid4())
        assert result == []


class TestCountMenuItems:
    @pytest.mark.asyncio
    async def test_returns_count(self):
        session = _make_session()
        session.execute.return_value.scalar_one.return_value = 5
        result = await count_menu_items(session, uuid.uuid4())
        assert result == 5


class TestCreateMenuItem:
    @pytest.mark.asyncio
    async def test_creates_and_returns(self):
        session = _make_session()
        restaurant_id = uuid.uuid4()
        item_id = uuid.uuid4()

        loaded_item = MagicMock()
        loaded_item.id = item_id
        session.execute.return_value.scalar_one_or_none.return_value = loaded_item

        item_data = MenuItemCreate(name="Бургер", price=250, category="BURGER")

        with patch("features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=loaded_item):
            result = await create_menu_item(session, item_data, restaurant_id)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()
        assert result is loaded_item

    @pytest.mark.asyncio
    async def test_raises_if_not_found_after_create(self):
        session = _make_session()
        item_data = MenuItemCreate(name="Бургер", price=250, category="BURGER")

        with patch("features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=None):
            with pytest.raises(RuntimeError, match="not found"):
                await create_menu_item(session, item_data, uuid.uuid4())


class TestUpdateMenuItem:
    @pytest.mark.asyncio
    async def test_updates_fields(self):
        session = _make_session()
        item = MagicMock()
        item.id = uuid.uuid4()
        loaded = MagicMock()

        update_data = MenuItemUpdate(name="Новый бургер")
        with patch("features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=loaded):
            result = await update_menu_item(session, item, update_data)

        session.flush.assert_awaited_once()
        assert result is loaded

    @pytest.mark.asyncio
    async def test_raises_if_not_found_after_update(self):
        session = _make_session()
        item = MagicMock()
        item.id = uuid.uuid4()

        update_data = MenuItemUpdate(name="X")
        with patch("features.menu.crud.get_menu_item_by_id", new_callable=AsyncMock, return_value=None):
            with pytest.raises(RuntimeError, match="not found"):
                await update_menu_item(session, item, update_data)


class TestDeleteMenuItem:
    @pytest.mark.asyncio
    async def test_marks_deleted(self):
        session = _make_session()
        item = MagicMock()
        await delete_menu_item(session, item)
        assert item.is_deleted is True
        session.flush.assert_awaited_once()


class TestCreateOptionGroup:
    @pytest.mark.asyncio
    async def test_creates_group(self):
        session = _make_session()
        item = MagicMock()
        item.id = uuid.uuid4()

        data = MenuItemOptionGroupCreate(
            name="Соусы",
            selection_type=SelectionType.MULTIPLE,
            is_required=False,
            options=[],
        )

        with patch("features.menu.crud.MenuItemOptionGroup") as MockGroup:
            mock_group = MagicMock()
            mock_group.options = []
            MockGroup.return_value = mock_group
            result = await create_option_group(session, item, data)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()


class TestGetOptionGroupById:
    @pytest.mark.asyncio
    async def test_returns_none(self):
        session = _make_session()
        result = await get_option_group_by_id(session, uuid.uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_group(self):
        session = _make_session()
        group = MagicMock()
        session.execute.return_value.scalar_one_or_none.return_value = group
        result = await get_option_group_by_id(session, uuid.uuid4())
        assert result is group


class TestUpdateOptionGroup:
    @pytest.mark.asyncio
    async def test_updates(self):
        session = _make_session()
        group = MagicMock()
        group.selection_type = SelectionType.MULTIPLE.value
        data = MenuItemOptionGroupUpdate(name="Напитки")
        result = await update_option_group(session, group, data)
        session.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_single_type_sets_max_1(self):
        session = _make_session()
        group = MagicMock()
        group.selection_type = SelectionType.SINGLE.value
        data = MenuItemOptionGroupUpdate()
        await update_option_group(session, group, data)
        assert group.max_selected == 1


class TestDeleteOptionGroup:
    @pytest.mark.asyncio
    async def test_deactivates(self):
        session = _make_session()
        group = MagicMock()
        await delete_option_group(session, group)
        assert group.is_active is False
        session.flush.assert_awaited_once()


class TestCreateOption:
    @pytest.mark.asyncio
    async def test_creates_option(self):
        session = _make_session()
        group = MagicMock()
        group.id = uuid.uuid4()
        data = MenuItemOptionCreate(name="Острый", price_delta=0)

        with patch("features.menu.crud.MenuItemOption") as MockOption:
            MockOption.return_value = MagicMock()
            result = await create_option(session, group, data)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()


class TestGetOptionById:
    @pytest.mark.asyncio
    async def test_returns_option(self):
        session = AsyncMock()
        option = MagicMock()
        session.get = AsyncMock(return_value=option)
        result = await get_option_by_id(session, uuid.uuid4())
        assert result is option

    @pytest.mark.asyncio
    async def test_returns_none(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        result = await get_option_by_id(session, uuid.uuid4())
        assert result is None


class TestUpdateOption:
    @pytest.mark.asyncio
    async def test_updates(self):
        session = _make_session()
        option = MagicMock()
        data = MenuItemOptionUpdate(name="Очень острый")
        await update_option(session, option, data)
        assert option.name == "Очень острый"
        session.flush.assert_awaited_once()


class TestDeleteOption:
    @pytest.mark.asyncio
    async def test_deactivates(self):
        session = _make_session()
        option = MagicMock()
        await delete_option(session, option)
        assert option.is_available is False
        session.flush.assert_awaited_once()
