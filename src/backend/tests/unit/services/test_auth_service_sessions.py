import time
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest

from features.auth.service import (
    logout_user,
    refresh_user_token,
    register_user,
)
from features.users.schemas import UserCreate, UserRead
from shared.exceptions.existence import AuthException


def _make_user() -> MagicMock:
    user = MagicMock()
    user.id = uuid.uuid4()
    user.name = "Test"
    user.phone_number = "+79001234567"
    user.permissions = []
    user.has_password = True
    user.first_name = None
    user.last_name = None
    user.middle_name = None
    user.email = None
    user.telegram_id = None
    user.telegram_username = None
    return user


class TestLogoutUser:
    async def test_logout_without_tokens_succeeds(self) -> None:
        request = MagicMock()
        request.cookies = {}
        request.headers = {}

        await logout_user(request)

    async def test_blacklists_valid_access_token(self) -> None:
        access_token = "valid_access"
        now = int(time.time())
        request = MagicMock()
        request.cookies = {"access_token": access_token}
        request.headers = {}

        mock_cache = MagicMock()
        mock_cache.set = AsyncMock()

        with patch(
            "features.auth.service.decode_jwt",
            return_value={"exp": now + 3600, "typ": "access", "jti": "jti1"},
        ):
            await logout_user(request, cache=mock_cache)

        mock_cache.set.assert_awaited()

    async def test_logout_ignores_invalid_token_error(self) -> None:
        request = MagicMock()
        request.cookies = {"access_token": "bad_token"}
        request.headers = {}

        mock_cache = MagicMock()

        with patch("features.auth.service.decode_jwt", side_effect=jwt.InvalidTokenError):
            await logout_user(request, cache=mock_cache)


class TestRegisterUser:
    async def test_register_user(self) -> None:
        data = UserCreate(name="Test", phone_number="+79001234567", password="Password1")
        mock_user = _make_user()

        with (
            patch("features.auth.service.ensure_user_not_exists_by_phone", new_callable=AsyncMock),
            patch(
                "features.auth.service.users_crud.create_user",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
        ):
            result = await register_user(AsyncMock(), data)

        assert isinstance(result, UserRead)
        assert result.id == mock_user.id


class TestRefreshUserToken:
    async def test_no_token_raises(self) -> None:
        request = MagicMock()
        request.cookies = {}
        request.headers = {}
        with pytest.raises(AuthException, match="missing"):
            await refresh_user_token(request, AsyncMock())

    async def test_expired_refresh_raises(self) -> None:
        request = MagicMock()
        request.cookies = {"refresh_token": "old"}
        request.headers = {}

        with patch("features.auth.service.decode_jwt", side_effect=jwt.ExpiredSignatureError):
            with pytest.raises(AuthException, match="expired"):
                await refresh_user_token(request, AsyncMock())

    async def test_wrong_type_raises(self) -> None:
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        with patch(
            "features.auth.service.decode_jwt",
            return_value={"typ": "access", "sub": "id", "exp": 9999999999},
        ):
            with pytest.raises(AuthException, match="token type"):
                await refresh_user_token(request, AsyncMock())

    async def test_session_expired_raises(self) -> None:
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        with patch(
            "features.auth.service.decode_jwt",
            return_value={
                "typ": "refresh",
                "sub": "00000000-0000-0000-0000-000000000001",
                "exp": 9999999999,
                "session_exp": int(time.time()) - 1000,
            },
        ):
            with pytest.raises(AuthException, match="Session has expired"):
                await refresh_user_token(request, AsyncMock())

    async def test_already_used_raises(self) -> None:
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        mock_cache = MagicMock()
        mock_cache.set_nx = AsyncMock(return_value=False)

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={
                    "typ": "refresh",
                    "sub": "00000000-0000-0000-0000-000000000001",
                    "exp": int(time.time()) + 3600,
                    "jti": "jti1",
                },
            ),
            patch("features.auth.service.get_redis_cache", return_value=mock_cache),
        ):
            with pytest.raises(AuthException, match="already used"):
                await refresh_user_token(request, AsyncMock(), cache=mock_cache)

    async def test_success(self) -> None:
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.set_nx = AsyncMock(return_value=True)

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={
                    "typ": "refresh",
                    "sub": "00000000-0000-0000-0000-000000000001",
                    "exp": int(time.time()) + 3600,
                    "jti": "jti1",
                },
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("features.auth.service.create_access_token", return_value="new_access"),
            patch("features.auth.service.create_refresh_token", return_value="new_refresh"),
        ):
            result = await refresh_user_token(request, AsyncMock(), cache=mock_cache)

        assert result.access_token == "new_access"
