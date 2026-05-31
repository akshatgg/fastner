import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.schemas import (
    ForgotPasswordRequest,
    MessageResponse,
    ProfileUpdate,
    RefreshRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SignInRequest,
    SignUpRequest,
    SignUpResponse,
    TokenResponse,
    UserResponse,
    UserRoleUpdate,
    VerifyEmailRequest,
)
from app.auth.service import AuthService
from app.core.database import get_db
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["auth"])

admin_router = APIRouter(
    prefix="/admin/users",
    tags=["users-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)


@router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignUpRequest, db: Session = Depends(get_db)) -> SignUpResponse:
    return AuthService(db).register(data)


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)) -> MessageResponse:
    AuthService(db).verify_email(data.token)
    return MessageResponse(message="Your email is verified. You can now sign in.")


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    data: ResendVerificationRequest, db: Session = Depends(get_db)
) -> MessageResponse:
    AuthService(db).resend_verification(data.email)
    return MessageResponse(
        message="If that account exists and is unverified, a new link is on its way."
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    data: ForgotPasswordRequest, db: Session = Depends(get_db)
) -> MessageResponse:
    AuthService(db).request_password_reset(data.email)
    return MessageResponse(
        message="If that account exists, a password reset link is on its way."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    data: ResetPasswordRequest, db: Session = Depends(get_db)
) -> MessageResponse:
    AuthService(db).reset_password(data.token, data.password)
    return MessageResponse(
        message="Your password has been reset. You can now sign in."
    )


@router.post("/login", response_model=TokenResponse)
def login(data: SignInRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).authenticate(data)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).refresh(data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(data: RefreshRequest, db: Session = Depends(get_db)) -> None:
    AuthService(db).revoke_refresh_token(data.refresh_token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return AuthService(db).update_profile(current_user, data)


# ============================ ADMIN: users ============================


@admin_router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return AuthService(db).list_users()


@admin_router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: uuid.UUID,
    data: UserRoleUpdate,
    actor: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
) -> User:
    return AuthService(db).set_user_role(actor, user_id, data.role)
