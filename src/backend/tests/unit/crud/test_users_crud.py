from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.users.crud import create_user, update_user, update_user_password
from features.users.schemas import UserCreate, UserUpdate


class TestCreateUser:
    @pytest.mark.asyncio
    async def test_create_user(self):
        data = UserCreate(
            name="Test User",
            phone_number="+79001234567",
            password="Password1",
        )
        mock_db_user = MagicMock()

        session = AsyncMock()
        session.add = MagicMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()

        with (
            patch(
                "features.users.crud.hash_password", new_callable=AsyncMock, return_value="hashed"
            ),
            patch("features.users.crud.User", return_value=mock_db_user),
        ):
            result = await create_user(session, data)

        session.add.assert_called_once_with(mock_db_user)
        session.flush.assert_awaited_once()
        assert result == mock_db_user


class TestUsersCrud:
    @pytest.mark.asyncio
    async def test_update_user(self):
        user = MagicMock()
        user.name = "old"
        update_data = UserUpdate(name="new name")

        session = AsyncMock()
        session.commit = AsyncMock()
        session.refresh = AsyncMock()

        await update_user(session, user, update_data)
        assert user.name == "new name"
        session.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_user_password(self):
        user = MagicMock()
        user.hashed_password = "old_hash"

        session = AsyncMock()
        session.commit = AsyncMock()

        with patch(
            "features.users.crud.hash_password", new_callable=AsyncMock, return_value="new_hash"
        ):
            await update_user_password(session, user, "newpassword")

        assert user.hashed_password == "new_hash"
        session.flush.assert_awaited_once()
