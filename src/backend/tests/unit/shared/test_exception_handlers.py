from http import HTTPStatus
from typing import cast
from unittest.mock import MagicMock

import pytest
from sqlalchemy.exc import IntegrityError
from starlette.requests import Request

from api.exception_handlers import (
    app_exception_handler,
    integrity_error_handler,
    unhandled_exception_handler,
)
from shared.exceptions.base import AppException


def _make_request() -> Request:
    request = MagicMock()
    request.state.request_id = None
    request.url.path = "/test"
    return cast("Request", request)


class TestAppExceptionHandler:
    @pytest.mark.asyncio
    async def test_returns_correct_status_and_detail(self) -> None:
        exc = AppException(status_code=HTTPStatus.NOT_FOUND, detail="Not found")
        response = await app_exception_handler(_make_request(), exc)
        assert response.status_code == HTTPStatus.NOT_FOUND
        body = response.body
        assert b"Not found" in body

    @pytest.mark.asyncio
    async def test_returns_400_for_bad_request(self) -> None:
        exc = AppException(status_code=HTTPStatus.BAD_REQUEST, detail="Bad request")
        response = await app_exception_handler(_make_request(), exc)
        assert response.status_code == HTTPStatus.BAD_REQUEST


class TestUnhandledExceptionHandler:
    @pytest.mark.asyncio
    async def test_returns_500(self) -> None:
        response = await unhandled_exception_handler(_make_request(), Exception("boom"))
        assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
        assert b"Internal server error" in response.body


class TestIntegrityErrorHandler:
    @pytest.mark.asyncio
    async def test_restaurants_address_constraint(self) -> None:
        exc = MagicMock(spec=IntegrityError)
        exc.orig = Exception("uq_restaurants_address violation")
        response = await integrity_error_handler(_make_request(), exc)
        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert b"restaurant with this address" in response.body

    @pytest.mark.asyncio
    async def test_users_phone_number_constraint(self) -> None:
        exc = MagicMock(spec=IntegrityError)
        exc.orig = Exception("uq_users_phone_number violation")
        response = await integrity_error_handler(_make_request(), exc)
        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert b"phone number" not in response.body
        assert b"Duplicate entry" in response.body

    @pytest.mark.asyncio
    async def test_unknown_constraint(self) -> None:
        exc = MagicMock(spec=IntegrityError)
        exc.orig = Exception("some_unknown_constraint violation")
        response = await integrity_error_handler(_make_request(), exc)
        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert b"Duplicate entry" in response.body
