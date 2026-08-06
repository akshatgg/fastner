"""Create or promote a superadmin from environment variables.

The normal signup flow never produces an admin — every new user is a
``customer`` and only an existing admin can change roles — so the *first*
superadmin has to be bootstrapped out of band. This does exactly that, and is
idempotent: run it once to create the account, or again to reset its password.

Credentials come from the environment so **no plaintext is committed**:

    SUPERADMIN_EMAIL      (required)
    SUPERADMIN_PASSWORD   (required)
    SUPERADMIN_NAME       (optional, default "Super Admin")

Run it against the target database (Postgres must be reachable):

    poetry run python -m app.auth.bootstrap_superadmin        # local
    # or as a one-off Cloud Run job against Cloud SQL in prod.

If the email already exists it is promoted to ``superadmin`` and its password
reset; otherwise a new, already-verified superadmin is created.
"""

import os

from sqlalchemy import select

from app.auth.helpers import hash_password
from app.auth.models import User
from app.core.database import SessionLocal

# Register every model with the mapper registry before touching the session,
# exactly as alembic/env.py and the catalog seed do (relationships span modules).
import app.auth.models  # noqa: E402,F401
import app.address.models  # noqa: E402,F401
import app.cart.models  # noqa: E402,F401
import app.catalog.models  # noqa: E402,F401
import app.coupons.models  # noqa: E402,F401
import app.industries.models  # noqa: E402,F401
import app.orders.models  # noqa: E402,F401
import app.reviews.models  # noqa: E402,F401
import app.settings.models  # noqa: E402,F401
import app.support.models  # noqa: E402,F401


def bootstrap_superadmin() -> None:
    email = os.environ.get("SUPERADMIN_EMAIL")
    password = os.environ.get("SUPERADMIN_PASSWORD")
    name = os.environ.get("SUPERADMIN_NAME", "Super Admin")
    if not email or not password:
        raise SystemExit("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must both be set.")

    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                full_name=name,
                email=email,
                hashed_password=hash_password(password),
                role="superadmin",
                is_verified=True,
            )
            db.add(user)
            action = "created"
        else:
            user.role = "superadmin"
            user.hashed_password = hash_password(password)
            user.is_verified = True
            action = "promoted (password reset)"
        db.commit()
        # Never log the password.
        print(f"Superadmin {action}: {email} (role={user.role}, verified={user.is_verified})")
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_superadmin()
