from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


# ── Input schemas ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterClientRequest(BaseModel):
    """Public registration — clients only."""
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class AdminCreateUserRequest(BaseModel):
    """Admin-only — creates manager or livreur accounts."""
    full_name: str
    email: EmailStr
    password: str
    role: UserRole
    phone: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: UserRole) -> UserRole:
        if v not in (UserRole.manager, UserRole.livreur):
            raise ValueError("Admin can only create manager or livreur accounts")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Output schemas ─────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    phone: Optional[str]
    is_active: bool
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str
