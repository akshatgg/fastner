"""Shared FastAPI auth dependencies, reusable by any feature router.

These live in utils (not inside the auth feature) because resolving the current
user and enforcing roles is cross-cutting — every protected route needs it.

    from app.utils.dependencies import get_current_user, require_role

    @router.get("/me")
    def me(user: User = Depends(get_current_user)): ...

    @router.get("/admin", dependencies=[Depends(require_role("admin"))])
    def admin_only(): ...
"""

import logging
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth import helpers
from app.auth.models import User
from app.core.database import get_db

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the Bearer access token and return the matching user."""
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = helpers.decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        logger.warning("Rejected request: invalid or expired access token")
        raise invalid

    if payload.get("type") != "access":
        raise invalid
    sub = payload.get("sub")
    if sub is None:
        raise invalid

    user = db.get(User, uuid.UUID(sub))
    if user is None:
        raise invalid
    return user


def require_role(*allowed_roles: str):
    """Dependency factory that allows only users whose role is in ``allowed_roles``."""

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            logger.warning(
                "Role check failed for user %s (role=%s, required one of %s)",
                current_user.id,
                current_user.role,
                allowed_roles,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )
        return current_user

    return checker
