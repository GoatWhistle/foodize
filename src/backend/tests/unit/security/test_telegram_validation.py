import hashlib
import hmac
import json
import time
from unittest.mock import patch
from urllib.parse import urlencode

import pytest

from features.telegram.exceptions import (
    InvalidTelegramInitDataException,
    MalformedTelegramInitDataException,
)
from features.telegram.webapp_auth import (
    _INIT_DATA_MAX_AGE,
    _consume_init_data_nonce,
    _extract_tg_user,
    _validate_init_data,
)
from settings.config.app_config import settings


def generate_valid_init_data(
    telegram_id: int = 123456, username: str = "test_user", override_auth_date: int | None = None
) -> str:
    auth_date = override_auth_date or int(time.time())
    user_data = json.dumps(
        {
            "id": telegram_id,
            "is_bot": False,
            "first_name": "Test",
            "username": username,
            "language_code": "en",
            "phone_number": "+79991234567",
        }
    )

    data_dict = {
        "user": user_data,
        "auth_date": str(auth_date),
        "query_id": "test_query_123",
    }

    secret_key = hmac.new(
        b"WebAppData",
        settings.telegram.bot_token.encode(),
        hashlib.sha256,
    ).digest()
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data_dict.items()))
    hash_value = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    data_dict["hash"] = hash_value

    return urlencode(data_dict)


class TestValidateInitData:

    def test_valid_init_data(self) -> None:
        init_data = generate_valid_init_data()
        result = _validate_init_data(init_data)

        assert result is not None
        assert result["user"]
        assert result["auth_date"]

    def test_invalid_hash(self) -> None:
        auth_date = int(time.time())
        user_data = json.dumps(
            {
                "id": 123456,
                "first_name": "Test",
                "username": "test_user",
            }
        )

        data_dict = {
            "user": user_data,
            "auth_date": str(auth_date),
            "query_id": "test_query_123",
            "hash": "invalid_hash_value",
        }

        init_data = urlencode(data_dict)

        with pytest.raises(InvalidTelegramInitDataException):
            _validate_init_data(init_data)

    def test_expired_init_data(self) -> None:
        expired_auth_date = int(time.time()) - (86400 + 3600)
        init_data = generate_valid_init_data(override_auth_date=expired_auth_date)

        with pytest.raises(InvalidTelegramInitDataException):
            _validate_init_data(init_data)

    def test_missing_hash(self) -> None:
        auth_date = int(time.time())
        user_data = json.dumps({"id": 123456, "first_name": "Test"})

        data_dict = {
            "user": user_data,
            "auth_date": str(auth_date),
            "query_id": "test_query_123",
        }

        init_data = urlencode(data_dict)

        with pytest.raises(MalformedTelegramInitDataException):
            _validate_init_data(init_data)

    def test_missing_auth_date(self) -> None:
        user_data = json.dumps({"id": 123456, "first_name": "Test"})

        data_dict = {
            "user": user_data,
            "query_id": "test_query_123",
        }

        secret_key = hmac.new(
            b"WebAppData",
            settings.telegram.bot_token.encode(),
            hashlib.sha256,
        ).digest()
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data_dict.items()))
        hash_value = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        data_dict["hash"] = hash_value

        init_data = urlencode(data_dict)

        with pytest.raises(MalformedTelegramInitDataException):
            _validate_init_data(init_data)

    def test_malformed_init_data(self) -> None:
        malformed_data = "not_a_valid_url_encoded_string!!!@@@"

        with pytest.raises(MalformedTelegramInitDataException):
            _validate_init_data(malformed_data)

    def test_invalid_user_json_is_not_validated_by_init_data(self) -> None:
        auth_date = int(time.time())

        data_dict = {
            "user": "not_valid_json",
            "auth_date": str(auth_date),
            "query_id": "test_query_123",
        }

        secret_key = hmac.new(
            b"WebAppData",
            settings.telegram.bot_token.encode(),
            hashlib.sha256,
        ).digest()
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data_dict.items()))
        hash_value = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        data_dict["hash"] = hash_value

        init_data = urlencode(data_dict)

        result = _validate_init_data(init_data)
        assert result is not None


class TestExtractTgUser:

    def test_valid_user(self) -> None:
        user_data = {"id": 123456, "first_name": "Test"}
        parsed = {"user": json.dumps(user_data)}
        result = _extract_tg_user(parsed)
        assert result["id"] == 123456

    def test_missing_user_id(self) -> None:
        user_data = {"first_name": "Test"}
        parsed = {"user": json.dumps(user_data)}
        with pytest.raises(MalformedTelegramInitDataException, match="Missing user id"):
            _extract_tg_user(parsed)

    def test_invalid_json(self) -> None:
        parsed = {"user": "not_json"}
        with pytest.raises(MalformedTelegramInitDataException, match="Invalid user payload"):
            _extract_tg_user(parsed)


class _FakeRedisCache:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def set_nx(self, key: str, value: str, ttl: int | None = None) -> bool:
        if key in self.store:
            return False
        self.store[key] = value
        return True


class TestConsumeInitDataNonce:
    def _parsed(self) -> dict[str, str]:
        return {"hash": "deadbeef", "auth_date": str(int(time.time()))}

    async def test_same_purpose_replay_is_rejected(self) -> None:
        cache = _FakeRedisCache()
        parsed = self._parsed()
        with patch("features.telegram.webapp_auth.get_redis_cache", return_value=cache):
            await _consume_init_data_nonce(parsed, "auth")
            with pytest.raises(InvalidTelegramInitDataException, match="already used"):
                await _consume_init_data_nonce(parsed, "auth")

    async def test_auth_and_register_do_not_conflict(self) -> None:
        cache = _FakeRedisCache()
        parsed = self._parsed()
        with patch("features.telegram.webapp_auth.get_redis_cache", return_value=cache):
            await _consume_init_data_nonce(parsed, "auth")
            await _consume_init_data_nonce(parsed, "register")

        assert len(cache.store) == 2

    async def test_expired_init_data_is_rejected(self) -> None:
        cache = _FakeRedisCache()
        parsed = {
            "hash": "deadbeef",
            "auth_date": str(int(time.time()) - _INIT_DATA_MAX_AGE - 10),
        }
        with patch("features.telegram.webapp_auth.get_redis_cache", return_value=cache):
            with pytest.raises(InvalidTelegramInitDataException, match="expired"):
                await _consume_init_data_nonce(parsed, "auth")


class TestEdgeCases:
    def test_edge_case_auth_date_exactly_at_limit(self) -> None:
        auth_date = int(time.time()) - 86400
        init_data = generate_valid_init_data(override_auth_date=auth_date)

        with pytest.raises(InvalidTelegramInitDataException):
            _validate_init_data(init_data)

    def test_edge_case_auth_date_within_limit(self) -> None:
        auth_date = int(time.time()) - 1800
        init_data = generate_valid_init_data(override_auth_date=auth_date)

        result = _validate_init_data(init_data)
        assert result is not None
