import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from settings.config.app_config import settings

_private_key: str = settings.auth.private_key_path.read_text()
_public_key: str = settings.auth.public_key_path.read_text()


def encode_jwt(
    payload: dict[str, Any],
    private_key: str = _private_key,
    algorithm: str = settings.auth.algorithm,
) -> str:
    return jwt.encode(payload, private_key, algorithm=algorithm)


def decode_jwt(
    token: str,
    public_key: str = _public_key,
    algorithm: str = settings.auth.algorithm,
) -> dict[str, Any]:
    return jwt.decode(token, public_key, algorithms=[algorithm])


def _create_jwt_token(
    user_id: uuid.UUID,
    lifetime_seconds: int,
    token_type: str,
    extra: dict[str, Any] | None = None,
) -> str:
    current_time_utc = datetime.now(UTC)
    expire = current_time_utc + timedelta(seconds=lifetime_seconds)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": current_time_utc,
        "typ": token_type,
        "jti": uuid.uuid4().hex,
    }
    if extra:
        payload.update(extra)
    return encode_jwt(payload=payload)


def create_access_token(user_id: uuid.UUID) -> str:
    return _create_jwt_token(
        user_id=user_id,
        lifetime_seconds=settings.auth.access_token_lifetime_seconds,
        token_type="access",
    )


def create_refresh_token(
    user_id: uuid.UUID,
    session_exp: int | None = None,
) -> str:
    current_time_utc = datetime.now(UTC)
    if session_exp is None:
        session_exp = int(
            (
                current_time_utc + timedelta(seconds=settings.auth.max_session_lifetime_seconds)
            ).timestamp()
        )
    return _create_jwt_token(
        user_id=user_id,
        lifetime_seconds=settings.auth.refresh_token_lifetime_seconds,
        token_type="refresh",
        extra={"session_exp": session_exp},
    )


_BCRYPT_ROUNDS = 12


def _hash_password_sync(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def _validate_password_sync(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password=password.encode("utf-8"),
        hashed_password=hashed_password.encode("utf-8"),
    )


async def hash_password(password: str) -> str:
    return await asyncio.to_thread(_hash_password_sync, password)


async def validate_password(password: str, hashed_password: str) -> bool:
    return await asyncio.to_thread(_validate_password_sync, password, hashed_password)
