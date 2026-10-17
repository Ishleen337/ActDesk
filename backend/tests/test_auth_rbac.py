import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token

def test_password_hashing_and_verification():
    pw = "SuperSecure123!"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_payload_decode():
    data = {"sub": "admin", "role": "store_admin"}
    token = create_access_token(data)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "admin"
    assert decoded["role"] == "store_admin"
    assert decoded["type"] == "access"
