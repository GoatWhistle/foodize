import pytest
from unittest.mock import patch, mock_open
from utils.JWT import hash_password, validate_password, create_jwt_token, decode_jwt
from datetime import datetime, timezone

def test_password_hashing():
    password = "secret_password"
    hashed = hash_password(password)
    assert hashed != password
    assert validate_password(password, hashed) is True
    assert validate_password("wrong_password", hashed) is False

def test_jwt_tokens():
    # Mocking encode_jwt itself to avoid file reading deep inside
    with patch("utils.JWT.encode_jwt", return_value="mocked_token") as mock_encode:
        token = create_jwt_token(user_id=1, phone_number="123", lifetime_seconds=3600)
        assert token == "mocked_token"
        assert mock_encode.called

def test_decode_jwt():
    # Calling decode_jwt with direct key to avoid read_text()
    with patch("jwt.decode", return_value={"sub": "1", "phone": "123"}) as mock_decode:
        payload = decode_jwt("some_token", public_key="test_public_key")
        assert payload["sub"] == "1"
        assert payload["phone"] == "123"
        assert mock_decode.called


