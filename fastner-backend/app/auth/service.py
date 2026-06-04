"""Auth business logic: registration, login, refresh-token rotation, and
email verification."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.auth import helpers
from app.auth.models import (
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    User,
)
from app.auth.schemas import (
    ProfileUpdate,
    SignInRequest,
    SignUpRequest,
    SignUpResponse,
    TokenResponse,
)
from app.core.config import settings
from app.orders.models import ACTIVE_STATUSES, Order
from app.utils.token_processor import decrypt_token, encrypt_token

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # --- queries -------------------------------------------------------------

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    # --- self-service profile ------------------------------------------------

    def update_profile(self, user: User, data: ProfileUpdate) -> User:
        """Update the signed-in user's own editable fields (name, phone).

        Only fields actually provided are touched, so a partial update can set
        just the phone without clearing the name. An empty-string phone clears
        it (back to "no number on file")."""
        fields = data.model_dump(exclude_unset=True)
        if "full_name" in fields and fields["full_name"] is not None:
            user.full_name = fields["full_name"].strip()
        if "phone" in fields:
            phone = fields["phone"]
            user.phone = phone.strip() or None if phone is not None else None
        self.db.commit()
        self.db.refresh(user)
        return user

    # --- admin: user management ----------------------------------------------

    def list_users(self) -> list[User]:
        """All users, newest first — for the admin user-management table."""
        return list(
            self.db.scalars(select(User).order_by(User.created_at.desc())).all()
        )

    def set_user_role(
        self, actor: User, user_id: uuid.UUID, new_role: str
    ) -> User:
        """Change a user's role.

        Guards: an admin can't change their own role (avoids self-lockout), and
        only a superadmin may modify another superadmin.
        """
        if actor.id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can't change your own role.",
            )
        user = self.db.get(User, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
            )
        if user.role == "superadmin" and actor.role != "superadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a superadmin can change a superadmin's role.",
            )
        user.role = new_role
        self.db.commit()
        self.db.refresh(user)
        return user

    # --- registration / login -----------------------------------------------

    def register(self, data: SignUpRequest) -> SignUpResponse:
        if self.get_user_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        # AUTO_VERIFY_EMAIL on → account is created already verified, no email.
        auto_verify = settings.AUTO_VERIFY_EMAIL
        user = User(
            full_name=data.full_name,
            email=data.email,
            hashed_password=helpers.hash_password(data.password),
            phone=data.phone,
            is_verified=auto_verify,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        if auto_verify:
            tokens = self._issue_token_pair(user)
            return SignUpResponse(
                requires_verification=False,
                message="Your account is ready.",
                access_token=tokens.access_token,
                refresh_token=tokens.refresh_token,
            )

        self._send_verification(user)
        return SignUpResponse(
            requires_verification=True,
            message="We've sent a verification link to your email.",
        )

    def authenticate(self, data: SignInRequest) -> TokenResponse:
        user = self.get_user_by_email(data.email)
        if (
            user is None
            or user.hashed_password is None
            or not helpers.verify_password(data.password, user.hashed_password)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        # Block unverified accounts unless verification is globally disabled.
        if not settings.AUTO_VERIFY_EMAIL and not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email address before signing in.",
            )
        return self._issue_token_pair(user)

    # --- email verification --------------------------------------------------

    def verify_email(self, raw_token: str) -> User:
        """Consume a verification token and mark the owning user verified."""
        invalid = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link is invalid or has already been used.",
        )
        record = self.db.get(
            EmailVerificationToken, helpers.hash_verification_token(raw_token)
        )
        if record is None:
            raise invalid

        if record.expires_at <= datetime.now(timezone.utc):
            self.db.delete(record)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification link has expired. Please request a new one.",
            )

        user = self.db.get(User, record.user_id)
        if user is None:
            self.db.delete(record)
            self.db.commit()
            raise invalid

        user.is_verified = True
        self.db.delete(record)  # single-use
        self.db.commit()
        return user

    def resend_verification(self, email: str) -> None:
        """Issue a fresh verification email if the account exists and is
        unverified. Always silent to avoid leaking which emails are registered."""
        user = self.get_user_by_email(email)
        if user is None or user.is_verified:
            return
        # Drop any outstanding tokens so only the newest link works.
        self.db.execute(
            delete(EmailVerificationToken).where(
                EmailVerificationToken.user_id == user.id
            )
        )
        self.db.commit()
        self._send_verification(user)

    # --- password reset ------------------------------------------------------

    def request_password_reset(self, email: str) -> None:
        """Issue a fresh password-reset email if the account exists. Always
        silent (no error if the email is unknown) so we don't leak which emails
        are registered."""
        user = self.get_user_by_email(email)
        # Google-only accounts have no password to reset — skip silently too.
        if user is None or user.hashed_password is None:
            return
        # Invalidate any outstanding reset tokens so only the newest link works.
        self.db.execute(
            delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
        )
        raw_token = helpers.generate_password_reset_token()
        self.db.add(
            PasswordResetToken(
                token_hash=helpers.hash_password_reset_token(raw_token),
                user_id=user.id,
                expires_at=helpers.password_reset_token_expiry(),
            )
        )
        self.db.commit()
        try:
            helpers.send_password_reset_email(user.email, user.full_name, raw_token)
        except Exception:  # noqa: BLE001 — a send failure shouldn't 500 the request
            logger.exception("Failed to send password-reset email to %s", user.email)

    def reset_password(self, raw_token: str, new_password: str) -> None:
        """Consume a reset token and set the user's new password.

        Resetting also revokes every existing refresh token for the user, so any
        sessions opened with the old password are logged out."""
        invalid = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has already been used.",
        )
        record = self.db.get(
            PasswordResetToken, helpers.hash_password_reset_token(raw_token)
        )
        if record is None:
            raise invalid

        if record.expires_at <= datetime.now(timezone.utc):
            self.db.delete(record)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This reset link has expired. Please request a new one.",
            )

        user = self.db.get(User, record.user_id)
        if user is None:
            self.db.delete(record)
            self.db.commit()
            raise invalid

        user.hashed_password = helpers.hash_password(new_password)
        self.db.delete(record)  # single-use
        # Revoke all sessions: old credentials must not stay valid after a reset.
        self.db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
        self.db.commit()

    # --- self-service password & account -------------------------------------

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> TokenResponse:
        """Change the signed-in user's password after confirming the current one.

        Every existing refresh token is revoked, then a fresh pair is issued and
        returned — so the device making the change stays signed in while all
        other sessions are logged out."""
        if user.hashed_password is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account signs in with Google and has no password to change.",
            )
        if not helpers.verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your current password is incorrect.",
            )
        if helpers.verify_password(new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your new password must be different from your current one.",
            )

        user.hashed_password = helpers.hash_password(new_password)
        # Drop every session, then mint a fresh pair (committed by the helper).
        self.db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
        return self._issue_token_pair(user)

    def delete_account(self, user: User, password: str | None) -> None:
        """Permanently delete the signed-in user's account.

        Guarded two ways: password accounts must re-enter their password, and an
        account can't be deleted while it still has an order in flight. The
        delete cascades to the user's orders, addresses, cart, reviews and
        tokens (see the FK ``ondelete`` rules)."""
        # Confirm identity for password accounts; Google-only accounts skip this.
        if user.hashed_password is not None and (
            not password or not helpers.verify_password(password, user.hashed_password)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your password is incorrect.",
            )

        open_orders = self.db.scalar(
            select(func.count())
            .select_from(Order)
            .where(Order.user_id == user.id)
            .where(Order.status.in_(ACTIVE_STATUSES))
        )
        if open_orders:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"You have {open_orders} order(s) still in progress. Please wait "
                    "until they're delivered or cancelled before deleting your account."
                ),
            )

        self.db.delete(user)
        self.db.commit()

    # --- refresh-token flow --------------------------------------------------

    def refresh(self, raw_refresh_token: str) -> TokenResponse:
        """Validate a refresh token, rotate it, and issue a new token pair.

        Rotation: the presented refresh token is deleted and a brand-new one is
        issued, so a refresh token can only be used once (mitigates replay).
        """
        token_hash = helpers.hash_refresh_token(raw_refresh_token)
        record = self.db.get(RefreshToken, token_hash)

        if record is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        # Expired? Drop it and reject.
        if record.expires_at <= datetime.now(timezone.utc):
            self.db.delete(record)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            )

        # Defense in depth: decrypt the stored token and confirm it matches the
        # presented one (guards against a hash collision / tampered lookup key).
        if decrypt_token(record.token) != raw_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        user = self.db.get(User, record.user_id)
        if user is None:
            self.db.delete(record)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        # Rotate: invalidate the old token, then issue a fresh pair.
        self.db.delete(record)
        return self._issue_token_pair(user)

    def revoke_refresh_token(self, raw_refresh_token: str) -> None:
        """Logout: delete the refresh token if it exists (idempotent)."""
        record = self.db.get(RefreshToken, helpers.hash_refresh_token(raw_refresh_token))
        if record is not None:
            self.db.delete(record)
            self.db.commit()

    # --- internals -----------------------------------------------------------

    def _send_verification(self, user: User) -> None:
        """Persist a fresh verification token and email the link. A send failure
        is logged but not raised — the user can resend rather than lose signup."""
        raw_token = helpers.generate_verification_token()
        self.db.add(
            EmailVerificationToken(
                token_hash=helpers.hash_verification_token(raw_token),
                user_id=user.id,
                expires_at=helpers.verification_token_expiry(),
            )
        )
        self.db.commit()
        try:
            helpers.send_verification_email(user.email, user.full_name, raw_token)
        except Exception:  # noqa: BLE001 — never fail signup on email trouble
            logger.exception("Failed to send verification email to %s", user.email)

    def _issue_token_pair(self, user: User) -> TokenResponse:
        access_token = helpers.create_access_token(user.id, user.role)

        raw_refresh = helpers.generate_refresh_token()
        self.db.add(
            RefreshToken(
                token_hash=helpers.hash_refresh_token(raw_refresh),
                token=encrypt_token(raw_refresh),
                user_id=user.id,
                expires_at=helpers.refresh_token_expiry(),
            )
        )
        self.db.commit()
        return TokenResponse(access_token=access_token, refresh_token=raw_refresh)
