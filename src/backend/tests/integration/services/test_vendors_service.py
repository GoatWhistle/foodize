import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user

from features.vendors.schemas import VendorCreate
from features.vendors.service import register_vendor, update_description
from shared.exceptions.rules import RuleException


def make_mock_vendor(user_id: uuid.UUID = None, description: str = None):
    v = MagicMock()
    v.id = uuid.uuid4()
    v.user_id = user_id or uuid.uuid4()
    v.description = description
    return v


class TestRegisterVendor:
    async def test_creates_vendor_profile_when_none_exists(self, mock_db_session):
        user = make_user()
        vendor_in = VendorCreate(description="Best vendor ever")
        mock_vendor = make_mock_vendor(user_id=user.id, description="Best vendor ever")

        with (
            patch(
                "features.vendors.service.get_vendor_by_user_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch(
                "features.vendors.service.create_vendor_profile",
                new_callable=AsyncMock,
                return_value=mock_vendor,
            ) as mock_create,
        ):
            result = await register_vendor(mock_db_session, user, vendor_in)

        mock_create.assert_awaited_once_with(
            session=mock_db_session, user=user, vendor_in=vendor_in
        )
        assert result is mock_vendor

    async def test_raises_if_vendor_profile_already_exists(self, mock_db_session):
        user = make_user()

        with patch(
            "features.vendors.service.get_vendor_by_user_id",
            new_callable=AsyncMock,
            return_value=MagicMock(),
        ):
            with pytest.raises(RuleException):
                await register_vendor(mock_db_session, user, VendorCreate())


class TestUpdateDescription:
    async def test_updates_description(self, mock_db_session):
        mock_vendor = make_mock_vendor()

        with patch(
            "features.vendors.service.update_vendor_description",
            new_callable=AsyncMock,
            return_value=mock_vendor,
        ) as mock_update:
            result = await update_description(mock_db_session, mock_vendor, "New description")

        mock_update.assert_awaited_once_with(mock_db_session, mock_vendor, "New description")
        assert result is mock_vendor
