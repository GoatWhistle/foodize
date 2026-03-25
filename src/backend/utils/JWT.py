from datetime import datetime, timedelta
import bcrypt
import jwt
from pytz import utc
from core.config import settings


def encode_jwt(
    payload: dict,
    private_key: str = settings.auth_jwt.private_key_path.read_text(),
    algorithm: str = settings.auth_jwt.algorithm,
):
    return jwt.encode(payload, private_key, algorithm=algorithm)


def decode_jwt(
    token: str,
    public_key: str = settings.auth_jwt.public_key_path.read_text(),
    algorithm: str = settings.auth_jwt.algorithm,
) -> dict:
    return jwt.decode(token, public_key, algorithms=[algorithm])


def create_jwt_token(
    user_id: int,
    phone_number: str,
    lifetime_seconds: int,
) -> str:
    current_time_utc = datetime.now(utc)
    expire = current_time_utc + timedelta(seconds=lifetime_seconds)

    payload = {
        "sub": str(user_id),
        "phone": phone_number,
        "exp": expire,
        "iat": current_time_utc,
    }
    return encode_jwt(payload=payload)


def create_access_token(user_id: int, phone_number: str) -> str:
    return create_jwt_token(
        user_id=user_id,
        phone_number=phone_number,
        lifetime_seconds=settings.auth_jwt.access_token_lifetime_seconds,
    )


def create_refresh_token(user_id: int, phone_number: str) -> str:
    return create_jwt_token(
        user_id=user_id,
        phone_number=phone_number,
        lifetime_seconds=settings.auth_jwt.refresh_token_lifetime_seconds,
    )


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def validate_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password=password.encode("utf-8"),
        hashed_password=hashed_password.encode("utf-8"),
    )
