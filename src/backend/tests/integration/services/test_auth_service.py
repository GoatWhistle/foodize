import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from factories import make_user

from features.auth.schemas import TokenResponse, UserLogin
from features.auth.service import (
    get_current_user,
    login_user,
    refresh_user_token,
    register_user,
)
from features.users.schemas import UserCreate
from shared.enums.roles import UserRole
from shared.exceptions.existence import AuthException, InvalidCredentialsException
from shared.exceptions.rules import RuleException


class TestRegisterUser:
    async def test_register_success(self, mock_db_session: AsyncMock) -> None:
        user_id = uuid.uuid4()

        with (
            patch(
                "features.auth.service.ensure_user_not_exists_by_phone",
                new_callable=AsyncMock,
            ) as mock_ensure,
            patch(
                "features.users.crud.create_user",
                new_callable=AsyncMock,
                return_value=make_user(user_id=user_id, name="Ivan"),
            ) as mock_create,
        ):
            user_data = UserCreate(
                name="Ivan",
                phone_number="79001234567",
                user_role=UserRole.CUSTOMER,
                password="strongpass1",
            )
            result = await register_user(mock_db_session, user_data)

        mock_ensure.assert_awaited_once_with(mock_db_session, "79001234567")
        mock_create.assert_awaited_once()
        assert result.id == user_id
        assert result.name == "Ivan"

    async def test_register_fails_if_phone_exists(self, mock_db_session: AsyncMock) -> None:
        with patch(
            "features.auth.service.ensure_user_not_exists_by_phone",
            new_callable=AsyncMock,
            side_effect=RuleException(),
        ):
            user_data = UserCreate(
                name="Ivan",
                phone_number="79001234567",
                user_role=UserRole.CUSTOMER,
                password="strongpass1",
            )
            with pytest.raises(RuleException):
                await register_user(mock_db_session, user_data)


class TestLoginUser:
    async def test_login_success_returns_tokens(self, mock_db_session: AsyncMock) -> None:
        user = make_user()

        with (
            patch(
                "features.auth.service.get_user_by_phone_or_401",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("features.auth.service.create_access_token", return_value="acc_tok"),
            patch("features.auth.service.create_refresh_token", return_value="ref_tok"),
        ):
            result = await login_user(
                mock_db_session,
                UserLogin(phone_number=user.phone_number, password="anypass12"),
            )

        assert isinstance(result, TokenResponse)
        assert result.access_token == "acc_tok"
        assert result.refresh_token == "ref_tok"

    async def test_login_invalid_credentials(self, mock_db_session: AsyncMock) -> None:
        with patch(
            "features.auth.service.get_user_by_phone_or_401",
            new_callable=AsyncMock,
            side_effect=InvalidCredentialsException(),
        ):
            with pytest.raises(InvalidCredentialsException):
                await login_user(
                    mock_db_session,
                    UserLogin(phone_number="79001234567", password="wrongpass"),
                )


class TestGetCurrentUser:
    async def test_no_token_raises_auth_exception(self, mock_db_session: AsyncMock) -> None:
        with pytest.raises(AuthException):
            await get_current_user(token=None, session=mock_db_session)  # type: ignore[arg-type]

    async def test_invalid_token_raises_auth_exception(self, mock_db_session: AsyncMock) -> None:
        with patch("features.auth.service.decode_jwt", side_effect=jwt.InvalidTokenError()):
            with pytest.raises(AuthException):
                await get_current_user(token="bad.token.here", session=mock_db_session)

    async def test_valid_token_returns_user(self, mock_db_session: AsyncMock) -> None:
        user = make_user()

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={"sub": str(user.id), "typ": "access"},
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
        ):
            result = await get_current_user(
                token="valid.jwt.token",
                session=mock_db_session,
                cache=MagicMock(exists=AsyncMock(return_value=False)),
            )

        assert result is user

    async def test_token_with_missing_sub_raises_auth_exception(
        self, mock_db_session: AsyncMock
    ) -> None:
        with patch("features.auth.service.decode_jwt", return_value={"phone": "7900"}):
            with pytest.raises(AuthException):
                await get_current_user(token="tok", session=mock_db_session)


class TestRefreshUserToken:
    async def test_refresh_success(self, mock_db_session: AsyncMock) -> None:
        user = make_user()
        mock_request = MagicMock()
        mock_request.cookies = {"refresh_token": "valid_refresh"}

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={
                    "sub": str(user.id),
                    "exp": 4_102_444_800,
                    "typ": "refresh",
                    "jti": "jti1",
                },
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("features.auth.service.create_access_token", return_value="new_acc"),
            patch("features.auth.service.create_refresh_token", return_value="new_ref"),
            patch(
                "features.auth.service.get_redis_cache",
                return_value=MagicMock(set_nx=AsyncMock(return_value=True)),
            ),
        ):
            result = await refresh_user_token(mock_request, mock_db_session)

        assert result.access_token == "new_acc"
        assert result.refresh_token == "new_ref"

    async def test_refresh_missing_token_raises(self, mock_db_session: AsyncMock) -> None:
        mock_request = MagicMock()
        mock_request.cookies = {}
        mock_request.headers = {}

        with patch(
            "features.auth.service._get_bearer_token",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(AuthException) as exc:
                await refresh_user_token(mock_request, mock_db_session)
        assert "Refresh token missing" in str(exc.value.detail)

    async def test_refresh_invalid_token_raises(self, mock_db_session: AsyncMock) -> None:
        mock_request = MagicMock()
        mock_request.cookies = {"refresh_token": "invalid"}

        with patch("features.auth.service.decode_jwt", side_effect=jwt.InvalidTokenError()):
            with pytest.raises(AuthException):
                await refresh_user_token(mock_request, mock_db_session)

    async def test_refresh_missing_sub_raises(self, mock_db_session: AsyncMock) -> None:
        mock_request = MagicMock()
        mock_request.cookies = {"refresh_token": "no_sub"}

        with patch("features.auth.service.decode_jwt", return_value={}):
            with pytest.raises(AuthException):
                await refresh_user_token(mock_request, mock_db_session)
