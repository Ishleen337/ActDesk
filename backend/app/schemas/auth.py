from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    full_name: str
    is_active: bool

    model_config = {"from_attributes": True}
