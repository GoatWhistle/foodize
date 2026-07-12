import uuid
from unittest.mock import AsyncMock, patch

import jwt
import pytest

from features.notifications.ws_auth import resolve_ws_token_user_id


def _make_cache(exists: bool) -> AsyncMock:
    cache = AsyncMock()
    cache.exists = AsyncMock(return_value=exists)
    return cache


class TestResolveWsTokenUserId:
    @pytest.mark.asyncio
    async def test_valid_token_returns_user_id(self) -> None:
        user_id = uuid.uuid4()
        payload = {"typ": "access", "sub": str(user_id), "jti": "jti-abc"}
        cache = _make_cache(exists=False)

        with (
            patch("features.notifications.ws_auth.decode_jwt", return_value=payload),
            patch("features.notifications.ws_auth.get_redis_cache", return_value=cache),
        ):
            result = await resolve_ws_token_user_id("raw.jwt.token")

        assert result == user_id
        cache.exists.assert_awaited_once_with("access_blacklist:jti-abc")

    @pytest.mark.asyncio
    async def test_revoked_token_by_jti_raises_permission_error(self) -> None:
        user_id = uuid.uuid4()
        payload = {"typ": "access", "sub": str(user_id), "jti": "jti-revoked"}
        cache = _make_cache(exists=True)

        with (
            patch("features.notifications.ws_auth.decode_jwt", return_value=payload),
            patch("features.notifications.ws_auth.get_redis_cache", return_value=cache),
        ):
            with pytest.raises(PermissionError):
                await resolve_ws_token_user_id("raw.jwt.token")

        cache.exists.assert_awaited_once_with("access_blacklist:jti-revoked")

    @pytest.mark.asyncio
    async def test_blacklist_checked_by_jti_not_raw_token(self) -> None:
        user_id = uuid.uuid4()
        raw_token = "raw.jwt.token"
        payload = {"typ": "access", "sub": str(user_id), "jti": "jti-xyz"}
        cache = _make_cache(exists=False)

        with (
            patch("features.notifications.ws_auth.decode_jwt", return_value=payload),
            patch("features.notifications.ws_auth.get_redis_cache", return_value=cache),
        ):
            await resolve_ws_token_user_id(raw_token)

        called_key = cache.exists.await_args.args[0]
        assert called_key == "access_blacklist:jti-xyz"
        assert raw_token not in called_key

    @pytest.mark.asyncio
    async def test_wrong_token_type_returns_none(self) -> None:
        payload = {"typ": "refresh", "sub": str(uuid.uuid4()), "jti": "jti-abc"}

        with patch("features.notifications.ws_auth.decode_jwt", return_value=payload):
            result = await resolve_ws_token_user_id("raw.jwt.token")

        assert result is None

    @pytest.mark.asyncio
    async def test_invalid_token_returns_none(self) -> None:
        with patch(
            "features.notifications.ws_auth.decode_jwt",
            side_effect=jwt.InvalidTokenError,
        ):
            result = await resolve_ws_token_user_id("bad.token")

        assert result is None

    @pytest.mark.asyncio
    async def test_missing_jti_skips_blacklist_check(self) -> None:
        user_id = uuid.uuid4()
        payload = {"typ": "access", "sub": str(user_id)}
        cache = _make_cache(exists=True)

        with (
            patch("features.notifications.ws_auth.decode_jwt", return_value=payload),
            patch("features.notifications.ws_auth.get_redis_cache", return_value=cache),
        ):
            result = await resolve_ws_token_user_id("raw.jwt.token")

        assert result == user_id
        cache.exists.assert_not_awaited()
