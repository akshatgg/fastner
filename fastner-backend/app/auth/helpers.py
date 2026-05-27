"""Auth helper methods: password hashing and JWT / refresh-token handling."""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings
from app.utils.email import send_email


# --- Password hashing ---------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Check a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


# --- Access tokens (JWT) ------------------------------------------------------

def create_access_token(user_id: uuid.UUID, role: str) -> str:
    """Create a short-lived signed JWT access token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Raises jwt exceptions on failure."""
    return jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )


# --- Refresh tokens (opaque, DB-backed) ---------------------------------------

def generate_refresh_token() -> str:
    """Generate a cryptographically-random opaque refresh token (the raw value
    handed to the client; only its hash is stored in the DB)."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(raw_token: str) -> str:
    """SHA-256 hash used as the DB primary key for a refresh token."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    """Absolute expiry timestamp for a newly issued refresh token."""
    return datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )


# --- Email verification tokens ------------------------------------------------

def generate_verification_token() -> str:
    """Random opaque token embedded in a verification link (raw value emailed)."""
    return secrets.token_urlsafe(48)


def hash_verification_token(raw_token: str) -> str:
    """SHA-256 hash used as the DB primary key for a verification token."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def verification_token_expiry() -> datetime:
    """Absolute expiry timestamp for a newly issued verification token."""
    return datetime.now(timezone.utc) + timedelta(
        hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS
    )


def send_verification_email(email: str, full_name: str, raw_token: str) -> None:
    """Email a verification link pointing at the frontend ``/verify-email`` page."""
    link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={raw_token}"
    hours = settings.EMAIL_VERIFICATION_EXPIRE_HOURS
    subject = "Verify your email — IBC Fasteners"
    html_body = f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#121212">
  <h2 style="color:#f26a21;text-transform:uppercase;letter-spacing:.5px">Confirm your email</h2>
  <p>Hi {full_name},</p>
  <p>Thanks for creating an IBC Fasteners account. Please confirm your email
     address to activate your account.</p>
  <p style="margin:28px 0">
    <a href="{link}"
       style="background:#f26a21;color:#fff;text-decoration:none;padding:12px 24px;
              border-radius:6px;font-weight:600;display:inline-block">
      Verify email
    </a>
  </p>
  <p style="color:#666;font-size:13px">Or paste this link into your browser:<br>
    <a href="{link}" style="color:#f26a21">{link}</a></p>
  <p style="color:#999;font-size:12px">This link expires in {hours} hours. If you
     didn't create this account, you can ignore this email.</p>
</div>"""
    text_body = (
        f"Hi {full_name},\n\n"
        "Thanks for creating an IBC Fasteners account. Verify your email here:\n"
        f"{link}\n\n"
        f"This link expires in {hours} hours. If you didn't create this account, "
        "you can ignore this email."
    )
    send_email(to=email, subject=subject, html_body=html_body, text_body=text_body)
