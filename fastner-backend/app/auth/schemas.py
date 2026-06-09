import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignUpRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=32)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    """A Google Sign-In ID token (the JWT ``credential`` returned by Google
    Identity Services in the browser), exchanged here for our own session."""

    credential: str = Field(min_length=1)


class ProfileUpdate(BaseModel):
    """Self-service profile edits. Only fields the user is allowed to change —
    email/role/verification are intentionally not editable here."""

    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=32)


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    """Change the signed-in user's password — requires the current password to
    confirm identity."""

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class DeleteAccountRequest(BaseModel):
    """Confirm account deletion. The password is required for password accounts
    (verified server-side); Google-only accounts have none to confirm."""

    password: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str


class SignUpResponse(BaseModel):
    """Result of a signup.

    When email verification is required, only ``requires_verification`` + a
    ``message`` are returned (no session). Otherwise the account is auto-verified
    and a token pair is included so the client logs in immediately.
    """

    requires_verification: bool
    message: str
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    phone: str | None
    is_verified: bool
    # False for Google-only accounts (no local password to change).
    has_password: bool
    created_at: datetime


# --- admin: user management --------------------------------------------------


class UserRoleUpdate(BaseModel):
    # Admins may toggle between these two roles; "superadmin" is intentionally
    # not assignable through the API.
    role: Literal["customer", "admin"]
