import uuid
from http import HTTPStatus
from unittest.mock import ANY, AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from features.staff.dependencies import get_valid_staff_request
from features.users.models import User
from features.vendors.models import VendorProfile
from main import app
from shared.enums.staff_request_status import StaffRequestStatus


class TestStaffAPI:
    async def test_create_staff_request(self, client: AsyncClient, as_user: User) -> None:
        restaurant_id = uuid.uuid4()
        req_id = uuid.uuid4()

        mock_response = {
            "id": str(req_id),
            "user_id": str(as_user.id),
            "restaurant_id": str(restaurant_id),
            "status": StaffRequestStatus.PENDING.value,
            "message": "Hire me pls",
        }

        with patch(
            "features.staff.api.service.create_staff_request",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_create:
            res = await client.post(
                f"/api/v1/staff/requests/{restaurant_id}",
                json={"message": "Hire me pls"},
            )

        assert res.status_code == HTTPStatus.OK
        assert res.json()["data"]["id"] == str(req_id)
        mock_create.assert_awaited_once()

    @pytest.mark.usefixtures("as_vendor")
    async def test_update_staff_status(self, client: AsyncClient) -> None:
        req_id = uuid.uuid4()

        mock_response = {
            "id": str(req_id),
            "user_id": str(uuid.uuid4()),
            "restaurant_id": str(uuid.uuid4()),
            "status": StaffRequestStatus.ACCEPTED.value,
            "message": "Hire me pls",
        }

        mock_req = MagicMock()
        mock_req.id = req_id

        app.dependency_overrides[get_valid_staff_request] = lambda: mock_req
        try:
            with patch(
                "features.staff.api.service.process_staff_request",
                new_callable=AsyncMock,
                return_value=mock_response,
            ) as mock_process:
                res = await client.patch(
                    f"/api/v1/staff/requests/{req_id}/status",
                    json={"status": StaffRequestStatus.ACCEPTED.value},
                )
        finally:
            app.dependency_overrides.pop(get_valid_staff_request, None)

        assert res.status_code == HTTPStatus.OK
        assert res.json()["data"]["status"] == StaffRequestStatus.ACCEPTED.value
        mock_process.assert_awaited_once_with(
            session=ANY, request=mock_req, new_status=StaffRequestStatus.ACCEPTED
        )

    async def test_read_vendor_requests(
        self, vendor_client: tuple[AsyncClient, VendorProfile]
    ) -> None:
        client, _vendor = vendor_client
        with patch(
            "features.staff.api.service.get_vendor_staff_requests",
            new_callable=AsyncMock,
            return_value=([], 0),
        ) as mock_get:
            res = await client.get("/api/v1/staff/my-requests")

        assert res.status_code == HTTPStatus.OK
        assert res.json()["data"] == []
        mock_get.assert_awaited_once()

    async def test_create_staff_request_requires_auth(self, client: AsyncClient) -> None:
        response = await client.post(
            f"/api/v1/staff/requests/{uuid.uuid4()}", json={"message": "hi"}
        )
        assert response.status_code == HTTPStatus.UNAUTHORIZED
