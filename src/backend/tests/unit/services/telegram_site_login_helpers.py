import uuid
from http import HTTPStatus
from unittest.mock import MagicMock, _patch, patch

import httpx
from pydantic import JsonValue

from features.users.models import User


def make_telegram_user(
    *, telegram_id: int | None = 123456, hashed_password: str | None = None
) -> User:
    user = User()
    user.id = uuid.uuid4()
    user.name = "Telegram User"
    user.phone_number = "+79001234567"
    user.telegram_id = telegram_id
    user.telegram_username = "ivan_tg"
    user.hashed_password = hashed_password
    return user


class FakeResponse:
    def __init__(self, status_code: int = HTTPStatus.OK, body: JsonValue = None) -> None:
        self.status_code = status_code
        self._body = body if body is not None else {}
        self.raised = False

    def json(self) -> JsonValue:
        return self._body

    def raise_for_status(self) -> None:
        self.raised = True
        if self.status_code >= HTTPStatus.BAD_REQUEST:
            raise httpx.HTTPStatusError("err", request=MagicMock(), response=MagicMock())


class FakeClient:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self._responses = responses
        self.calls: list[dict[str, str]] = []

    async def __aenter__(self) -> "FakeClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, url: str, json: dict[str, str]) -> FakeResponse:
        del url
        self.calls.append(json)
        return self._responses.pop(0)


def patch_telegram_client(client: FakeClient) -> "_patch[MagicMock]":
    return patch("features.telegram.site_login.httpx.AsyncClient", return_value=client)
