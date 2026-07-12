from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest

from features.auth.service import get_current_user
from shared.exceptions.existence import AuthException


class TestGetCurrentUserDeactivated:
    @pytest.mark.asyncio
    async def test_inactive_user_raises(self) -> None:
        user = MagicMock()
        user.is_active = False

        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=False)
        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={"sub": "00000000-0000-0000-0000-000000000001", "typ": "access"},
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
        ):
            with pytest.raises(AuthException):
                await get_current_user("some_token", AsyncMock(), cache=mock_cache)


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_no_token_raises(self) -> None:
        with pytest.raises(AuthException, match="Not authenticated"):
            await get_current_user(token=None, session=AsyncMock())  # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_expired_token_raises(self) -> None:
        with patch("features.auth.service.decode_jwt", side_effect=jwt.ExpiredSignatureError):
            with pytest.raises(AuthException, match="expired"):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_invalid_token_raises(self) -> None:
        with patch("features.auth.service.decode_jwt", side_effect=jwt.InvalidTokenError):
            with pytest.raises(AuthException, match="Invalid token"):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_wrong_token_type_raises(self) -> None:
        with patch(
            "features.auth.service.decode_jwt", return_value={"sub": "id", "typ": "refresh"}
        ):
            with pytest.raises(AuthException, match="token type"):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_no_sub_raises(self) -> None:
        with patch("features.auth.service.decode_jwt", return_value={"typ": "access"}):
            with pytest.raises(AuthException):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_blacklisted_token_raises(self) -> None:
        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=True)

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={
                    "sub": "00000000-0000-0000-0000-000000000001",
                    "typ": "access",
                    "jti": "jti1",
                },
            ),
        ):
            with pytest.raises(AuthException, match="invalidated"):
                await get_current_user(token="tok", session=AsyncMock(), cache=mock_cache)

    @pytest.mark.asyncio
    async def test_invalid_uuid_raises(self) -> None:
        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=False)
        with patch(
            "features.auth.service.decode_jwt", return_value={"sub": "not-a-uuid", "typ": "access"}
        ):
            with pytest.raises(AuthException):
                await get_current_user(token="tok", session=AsyncMock(), cache=mock_cache)

    @pytest.mark.asyncio
    async def test_active_user_returned(self) -> None:
        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=False)

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={"sub": "00000000-0000-0000-0000-000000000001", "typ": "access"},
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
        ):
            result = await get_current_user(token="tok", session=AsyncMock(), cache=mock_cache)
        assert result == user
