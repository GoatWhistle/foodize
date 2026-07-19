import json
import time
import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.telegram.exceptions import InvalidTelegramInitDataException
from features.telegram.schemas import TelegramCheckResponse
from features.telegram.webapp_auth import (
    telegram_auth_existing,
    telegram_check,
    telegram_register,
    unlink_telegram_for_user,
)
from features.users.models import User


def _parsed(
    telegram_id: int = 123, username: str = "user", phone: str | None = None
) -> dict[str, Any]:
    user: dict[str, Any] = {"id": telegram_id, "username": username}
    if phone is not None:
        user["phone_number"] = phone
    return {
        "user": json.dumps(user),
        "auth_date": str(int(time.time())),
        "hash": "deadbeef",
    }


def _user() -> User:
    u = User()
    u.id = uuid.uuid4()
    u.telegram_id = 123
    u.telegram_username = "user"
    return u


async def test_telegram_check_registered() -> None:
    with (
        patch(
            "features.telegram.webapp_auth._validate_init_data",
            return_value=_parsed(),
        ),
        patch(
            "features.telegram.webapp_auth.get_user_by_telegram_id",
            new_callable=AsyncMock,
            return_value=_user(),
        ),
    ):
        result = await telegram_check(AsyncMock(), "init")
    assert isinstance(result, TelegramCheckResponse)
    assert result.status == "registered"


async def test_telegram_check_new_user_returns_phone() -> None:
    with (
        patch(
            "features.telegram.webapp_auth._validate_init_data",
            return_value=_parsed(phone="+79990001122"),
        ),
        patch(
            "features.telegram.webapp_auth.get_user_by_telegram_id",
            new_callable=AsyncMock,
            return_value=None,
        ),
    ):
        result = await telegram_check(AsyncMock(), "init")
    assert result.status == "new_user"
    assert result.phone_number == "+79990001122"


async def test_telegram_register_creates_and_returns_tokens() -> None:
    user = _user()
    tokens = MagicMock(access_token="a", refresh_token="r", token_type="Bearer")
    with (
        patch(
            "features.telegram.webapp_auth._validate_init_data",
            return_value=_parsed(),
        ),
        patch(
            "features.telegram.webapp_auth._consume_init_data_nonce",
            new_callable=AsyncMock,
        ) as consume,
        patch(
            "features.telegram.webapp_auth.find_or_create_telegram_user",
            new_callable=AsyncMock,
            return_value=user,
        ) as create,
        patch("features.telegram.webapp_auth.make_tokens", return_value=tokens),
    ):
        result = await telegram_register(AsyncMock(), "init", "79990001122", "Name")

    assert result.access_token == "a"
    consume.assert_awaited_once()
    assert consume.await_args is not None
    assert consume.await_args.args[1] == "register"
    assert create.await_args is not None
    assert create.await_args.kwargs["check_username"] is False


async def test_telegram_auth_existing_success() -> None:
    user = _user()
    tokens = MagicMock(access_token="a")
    with (
        patch(
            "features.telegram.webapp_auth._validate_init_data",
            return_value=_parsed(),
        ),
        patch(
            "features.telegram.webapp_auth._consume_init_data_nonce",
            new_callable=AsyncMock,
        ),
        patch(
            "features.telegram.webapp_auth.get_user_by_telegram_id",
            new_callable=AsyncMock,
            return_value=user,
        ),
        patch(
            "features.telegram.webapp_auth.cache_telegram_id",
            new_callable=AsyncMock,
        ) as cache,
        patch("features.telegram.webapp_auth.make_tokens", return_value=tokens),
    ):
        result = await telegram_auth_existing(AsyncMock(), "init")

    assert result.access_token == "a"
    cache.assert_awaited_once()


async def test_telegram_auth_existing_user_not_found() -> None:
    with (
        patch(
            "features.telegram.webapp_auth._validate_init_data",
            return_value=_parsed(),
        ),
        patch(
            "features.telegram.webapp_auth._consume_init_data_nonce",
            new_callable=AsyncMock,
        ),
        patch(
            "features.telegram.webapp_auth.get_user_by_telegram_id",
            new_callable=AsyncMock,
            return_value=None,
        ),
    ):
        with pytest.raises(InvalidTelegramInitDataException, match="User not found"):
            await telegram_auth_existing(AsyncMock(), "init")


async def test_unlink_telegram_clears_fields() -> None:
    user = _user()
    session = AsyncMock()
    with patch(
        "features.telegram.webapp_auth.delete_cached_telegram_id",
        new_callable=AsyncMock,
    ) as delete:
        result = await unlink_telegram_for_user(session, user)

    assert result.telegram_id is None
    assert result.telegram_username is None
    session.flush.assert_awaited_once()
    delete.assert_awaited_once()
