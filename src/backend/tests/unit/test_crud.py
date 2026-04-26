import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.users.crud import update_user, update_user_password
from features.vendors.crud import (
    create_vendor_profile,
    get_vendor_by_user_id,
    get_vendor_by_user_id_or_404,
    update_vendor_description,
)


class TestVendorCrud:
    @pytest.mark.asyncio
    async def test_get_vendor_by_user_id_found(self):
        user_id = uuid.uuid4()
        vendor = MagicMock()
        vendor.id = uuid.uuid4()
        vendor.user_id = user_id

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=vendor)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_vendor_by_user_id(session, user_id)
        assert result == vendor

    @pytest.mark.asyncio
    async def test_get_vendor_by_user_id_not_found(self):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_vendor_by_user_id(session, uuid.uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_get_vendor_by_user_id_or_404_found(self):
        user_id = uuid.uuid4()
        vendor = MagicMock()
        vendor.id = uuid.uuid4()
        vendor.user_id = user_id

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=vendor)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_vendor_by_user_id_or_404(session, user_id)
        assert result == vendor

    @pytest.mark.asyncio
    async def test_get_vendor_by_user_id_or_404_raises(self):
        from shared.exceptions import NotFoundException

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(NotFoundException):
            await get_vendor_by_user_id_or_404(session, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_update_vendor_description(self):
        vendor = MagicMock()
        vendor.description = "old"

        session = AsyncMock()
        session.commit = AsyncMock()

        await update_vendor_description(session, vendor, "new description")
        assert vendor.description == "new description"
        session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_vendor_profile(self):
        from features.vendors.schemas import VendorCreate

        user = MagicMock()
        user.id = uuid.uuid4()
        vendor_in = VendorCreate(description="Test vendor")

        session = AsyncMock()
        session.add = MagicMock()
        session.commit = AsyncMock()

        with patch("features.vendors.crud.VendorProfile") as MockVendorProfile:
            mock_vendor = MagicMock()
            MockVendorProfile.return_value = mock_vendor
            await create_vendor_profile(session, user, vendor_in)
            session.add.assert_called_once_with(mock_vendor)
            session.commit.assert_awaited_once()


class TestUsersCrud:
    @pytest.mark.asyncio
    async def test_update_user(self):
        from features.users.schemas import UserUpdate

        user = MagicMock()
        user.name = "old"
        update_data = UserUpdate(name="new name")

        session = AsyncMock()
        session.commit = AsyncMock()
        session.refresh = AsyncMock()

        await update_user(session, user, update_data)
        assert user.name == "new name"
        session.commit.assert_awaited_once()
        session.refresh.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_user_password(self):
        user = MagicMock()
        user.hashed_password = "old_hash"

        session = AsyncMock()
        session.commit = AsyncMock()

        with patch("features.users.crud.hash_password", return_value="new_hash"):
            await update_user_password(session, user, "newpassword")

        assert user.hashed_password == "new_hash"
        session.commit.assert_awaited_once()
