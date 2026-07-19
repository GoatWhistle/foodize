import uuid
from datetime import UTC, datetime

import jwt
import pytest

from settings.config.app_config import settings
from utils.jwt_tokens import (
    create_access_token,
    create_refresh_token,
    decode_jwt,
    encode_jwt,
    hash_password,
    validate_password,
)


class TestPasswordHashing:
    async def test_hash_differs_from_plain(self) -> None:
        plain = "supersecret123"
        hashed = await hash_password(plain)
        assert hashed != plain

    async def test_correct_password_validates(self) -> None:
        plain = "supersecret123"
        hashed = await hash_password(plain)
        assert await validate_password(plain, hashed) is True

    async def test_wrong_password_rejected(self) -> None:
        hashed = await hash_password("supersecret123")
        assert await validate_password("wrongpassword1", hashed) is False

    async def test_empty_password_hashed(self) -> None:
        hashed = await hash_password("")
        assert isinstance(hashed, str)
        assert await validate_password("", hashed) is True

    async def test_two_hashes_of_same_password_differ(self) -> None:
        plain = "samepassword1"
        h1 = await hash_password(plain)
        h2 = await hash_password(plain)
        assert h1 != h2


class TestEncodeDecodeJwt:
    def test_encode_then_decode_roundtrip(self) -> None:
        user_id = str(uuid.uuid4())
        exp = int(datetime.now(UTC).timestamp()) + 3600
        token = encode_jwt({"sub": user_id, "exp": exp})
        decoded = decode_jwt(token)
        assert decoded["sub"] == user_id

    def test_decode_rejects_tampered_token(self) -> None:
        token = encode_jwt({"sub": "abc", "exp": int(datetime.now(UTC).timestamp()) + 3600})
        tampered = token[:-2] + ("aa" if token[-2:] != "aa" else "bb")
        with pytest.raises(jwt.PyJWTError):
            decode_jwt(tampered)

    def test_decode_accepts_explicit_public_key(self) -> None:
        user_id = str(uuid.uuid4())
        token = encode_jwt({"sub": user_id, "exp": int(datetime.now(UTC).timestamp()) + 3600})
        public_key = settings.auth.public_key_path.read_text()
        result = decode_jwt(token, public_key=public_key)
        assert result["sub"] == user_id


class TestCreateJwtToken:
    def test_access_token_payload_fields(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id=user_id)
        decoded = decode_jwt(token)
        assert decoded["sub"] == str(user_id)
        assert "phone" not in decoded
        assert "exp" in decoded
        assert "iat" in decoded
        assert decoded["typ"] == "access"

    def test_access_token_expiry_is_in_future(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id=user_id)
        decoded = decode_jwt(token)
        assert decoded["exp"] > int(datetime.now(UTC).timestamp())


class TestAccessRefreshTokens:
    def test_access_token_typed_access(self) -> None:
        token = create_access_token(user_id=uuid.uuid4())
        assert decode_jwt(token)["typ"] == "access"

    def test_refresh_token_typed_refresh(self) -> None:
        token = create_refresh_token(user_id=uuid.uuid4())
        assert decode_jwt(token)["typ"] == "refresh"

    def test_refresh_token_includes_session_exp(self) -> None:
        token = create_refresh_token(user_id=uuid.uuid4())
        decoded = decode_jwt(token)
        assert "session_exp" in decoded
        assert isinstance(decoded["session_exp"], int)

    def test_refresh_token_uses_explicit_session_exp(self) -> None:
        token = create_refresh_token(user_id=uuid.uuid4(), session_exp=9999999999)
        assert decode_jwt(token)["session_exp"] == 9999999999

    def test_access_expires_before_refresh(self) -> None:
        user_id = uuid.uuid4()
        access = decode_jwt(create_access_token(user_id=user_id))
        refresh = decode_jwt(create_refresh_token(user_id=user_id))
        assert access["exp"] < refresh["exp"]
