from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class GuestSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    is_guest: bool = True


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str | None
    display_name: str | None
    is_guest: bool
    is_admin: bool

    model_config = {"from_attributes": True}
