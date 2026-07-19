import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.auth.schemas import UserLogin
from features.users.dependencies import (
    ensure_user_not_exists_by_phone,
    get_user_by_id,
    get_user_by_id_or_404,
    get_user_by_phone,
    get_user_by_phone_or_401,
)
from features.users.exceptions import UserAlreadyExistsException
from shared.exceptions.existence import InvalidCredentialsException, NotFoundException


def _mock_session(scalar_result: object = None) -> AsyncMock:
    session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value=scalar_result)
    session.execute = AsyncMock(return_value=mock_result)
    return session


async def test_get_user_by_phone_found() -> None:
    user = MagicMock()
    session = _mock_session(user)
    result = await get_user_by_phone(session, "+79001234567")
    assert result == user


async def test_get_user_by_phone_not_found() -> None:
    session = _mock_session(None)
    result = await get_user_by_phone(session, "+79001234567")
    assert result is None


async def test_get_user_by_id_found() -> None:
    user = MagicMock()
    session = _mock_session(user)
    result = await get_user_by_id(session, uuid.uuid4())
    assert result == user


async def test_get_user_by_id_not_found() -> None:
    session = _mock_session(None)
    result = await get_user_by_id(session, uuid.uuid4())
    assert result is None


async def test_get_user_by_id_or_404_found() -> None:
    user = MagicMock()
    with patch(
        "features.users.dependencies.get_user_by_id", new_callable=AsyncMock, return_value=user
    ):
        result = await get_user_by_id_or_404(AsyncMock(), uuid.uuid4())
    assert result == user


async def test_get_user_by_id_or_404_not_found() -> None:
    with patch(
        "features.users.dependencies.get_user_by_id", new_callable=AsyncMock, return_value=None
    ):
        with pytest.raises(NotFoundException):
            await get_user_by_id_or_404(AsyncMock(), uuid.uuid4())


async def test_get_user_by_phone_or_401_success() -> None:

    user = MagicMock()
    user.hashed_password = "hashed"
    user_data = UserLogin(phone_number="+79001234567", password="password123")

    with (
        patch(
            "features.users.dependencies.get_user_by_phone",
            new_callable=AsyncMock,
            return_value=user,
        ),
        patch(
            "features.users.dependencies.validate_password",
            new_callable=AsyncMock,
            return_value=True,
        ),
    ):
        result = await get_user_by_phone_or_401(AsyncMock(), user_data)
    assert result == user


async def test_get_user_by_phone_or_401_user_not_found() -> None:

    user_data = UserLogin(phone_number="+79001234567", password="password123")

    with patch(
        "features.users.dependencies.get_user_by_phone", new_callable=AsyncMock, return_value=None
    ):
        with pytest.raises(InvalidCredentialsException):
            await get_user_by_phone_or_401(AsyncMock(), user_data)


async def test_get_user_by_phone_or_401_no_password() -> None:

    user = MagicMock()
    user.hashed_password = None
    user_data = UserLogin(phone_number="+79001234567", password="password123")

    with patch(
        "features.users.dependencies.get_user_by_phone", new_callable=AsyncMock, return_value=user
    ):
        with pytest.raises(InvalidCredentialsException):
            await get_user_by_phone_or_401(AsyncMock(), user_data)


async def test_get_user_by_phone_or_401_wrong_password() -> None:

    user = MagicMock()
    user.hashed_password = "hashed"
    user_data = UserLogin(phone_number="+79001234567", password="wrongpassword")

    with (
        patch(
            "features.users.dependencies.get_user_by_phone",
            new_callable=AsyncMock,
            return_value=user,
        ),
        patch(
            "features.users.dependencies.validate_password",
            new_callable=AsyncMock,
            return_value=False,
        ),
    ):
        with pytest.raises(InvalidCredentialsException):
            await get_user_by_phone_or_401(AsyncMock(), user_data)


async def test_ensure_user_not_exists_by_phone_ok() -> None:
    with patch(
        "features.users.dependencies.get_user_by_phone", new_callable=AsyncMock, return_value=None
    ):
        await ensure_user_not_exists_by_phone(AsyncMock(), "+79001234567")


async def test_ensure_user_not_exists_by_phone_raises() -> None:
    user = MagicMock()
    with patch(
        "features.users.dependencies.get_user_by_phone", new_callable=AsyncMock, return_value=user
    ):
        with pytest.raises(UserAlreadyExistsException):
            await ensure_user_not_exists_by_phone(AsyncMock(), "+79001234567")
