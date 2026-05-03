import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from shared.enums.roles import UserRole

from features.vendors.dependencies import (
    ensure_no_vendor_profile,
    get_current_vendor,
    get_vendor_or_404,
)
from features.vendors.exceptions import VendorAlreadyExistsException
from shared.exceptions import AccessDeniedException, NotFoundException


class TestVendorDependencies:
    @pytest.mark.asyncio
    async def test_get_current_vendor(self):
        current_user = MagicMock(id=uuid.uuid4(), user_role=UserRole.VENDOR.value)
        mock_user = MagicMock()
        mock_user.vendor_profile = "PROFILE"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        res = await get_current_vendor(mock_session, current_user)
        assert res == "PROFILE"

    @pytest.mark.asyncio
    async def test_get_current_vendor_requires_permission(self):
        current_user = MagicMock(id=uuid.uuid4(), user_role=UserRole.CUSTOMER.value)

        with pytest.raises(AccessDeniedException):
            await get_current_vendor(AsyncMock(), current_user)

    @pytest.mark.asyncio
    async def test_ensure_no_vendor_profile_raises(self):
        with patch(
            "features.vendors.dependencies.get_vendor_by_user_id",
            new_callable=AsyncMock,
            return_value=MagicMock(),
        ):
            with pytest.raises(VendorAlreadyExistsException):
                await ensure_no_vendor_profile(MagicMock(id=uuid.uuid4()), MagicMock())

    @pytest.mark.asyncio
    async def test_get_vendor_or_404_raises(self):
        with patch(
            "features.vendors.dependencies.get_vendor_by_user_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(NotFoundException):
                await get_vendor_or_404(MagicMock(id=uuid.uuid4()), MagicMock())
