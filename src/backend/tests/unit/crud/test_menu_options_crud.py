import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.menu.crud import (
    create_option,
    create_option_group,
    delete_option,
    delete_option_group,
    get_option_by_id,
    get_option_group_by_id,
    update_option,
    update_option_group,
)
from features.menu.schemas import (
    MenuItemOptionCreate,
    MenuItemOptionGroupCreate,
    MenuItemOptionGroupUpdate,
    MenuItemOptionUpdate,
)
from shared.enums.selection_type import SelectionType

from .menu_crud_helpers import make_menu_session


class TestCreateOptionGroup:
    async def test_creates_group(self) -> None:
        session = make_menu_session()
        item = MagicMock()
        item.id = uuid.uuid4()

        data = MenuItemOptionGroupCreate(
            name="Соусы",
            selection_type=SelectionType.MULTIPLE,
            is_required=False,
            options=[],
        )

        with patch("features.menu.crud.MenuItemOptionGroup") as mock_group_cls:
            mock_group = MagicMock()
            mock_group.options = []
            mock_group_cls.return_value = mock_group
            await create_option_group(session, item, data)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()


class TestGetOptionGroupById:
    async def test_returns_none(self) -> None:
        session = make_menu_session()
        result = await get_option_group_by_id(session, uuid.uuid4())
        assert result is None

    async def test_returns_group(self) -> None:
        session = make_menu_session()
        group = MagicMock()
        session.execute.return_value.scalar_one_or_none.return_value = group
        result = await get_option_group_by_id(session, uuid.uuid4())
        assert result is group


class TestUpdateOptionGroup:
    async def test_updates(self) -> None:
        session = make_menu_session()
        group = MagicMock()
        group.selection_type = SelectionType.MULTIPLE.value
        data = MenuItemOptionGroupUpdate(name="Напитки")
        await update_option_group(session, group, data)
        session.flush.assert_awaited_once()

    async def test_single_type_sets_max_1(self) -> None:
        session = make_menu_session()
        group = MagicMock()
        group.selection_type = SelectionType.SINGLE.value
        data = MenuItemOptionGroupUpdate()
        await update_option_group(session, group, data)
        assert group.max_selected == 1


class TestDeleteOptionGroup:
    async def test_deactivates(self) -> None:
        session = make_menu_session()
        group = MagicMock()
        await delete_option_group(session, group)
        assert group.is_active is False
        session.flush.assert_awaited_once()


class TestCreateOption:
    async def test_creates_option(self) -> None:
        session = make_menu_session()
        group = MagicMock()
        group.id = uuid.uuid4()
        data = MenuItemOptionCreate(name="Острый", price_delta=0)

        with patch("features.menu.crud.MenuItemOption") as mock_option_cls:
            mock_option_cls.return_value = MagicMock()
            await create_option(session, group, data)

        session.add.assert_called_once()
        session.flush.assert_awaited_once()


class TestGetOptionById:
    async def test_returns_option(self) -> None:
        session = AsyncMock()
        option = MagicMock()
        session.get = AsyncMock(return_value=option)
        result = await get_option_by_id(session, uuid.uuid4())
        assert result is option

    async def test_returns_none(self) -> None:
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        result = await get_option_by_id(session, uuid.uuid4())
        assert result is None


class TestUpdateOption:
    async def test_updates(self) -> None:
        session = make_menu_session()
        option = MagicMock()
        data = MenuItemOptionUpdate(name="Очень острый")
        await update_option(session, option, data)
        assert option.name == "Очень острый"
        session.flush.assert_awaited_once()


class TestDeleteOption:
    async def test_deactivates(self) -> None:
        session = make_menu_session()
        option = MagicMock()
        await delete_option(session, option)
        assert option.is_available is False
        session.flush.assert_awaited_once()
