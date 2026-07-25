import os

from dotenv import load_dotenv

load_dotenv()


def _env_bool(key: str, default: bool) -> bool:
    """Parse a truthy/falsy environment variable (1/true/yes/on → True)."""
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    """Application configuration sourced from environment variables."""

    # Deployment environment. Drives environment-specific defaults below.
    # "development" / "dev" / "local" → development; anything else → production.
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production").strip().lower()
    IS_DEVELOPMENT: bool = ENVIRONMENT in {"development", "dev", "local"}

    # Logging verbosity for the root logger (DEBUG/INFO/WARNING/ERROR).
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # JWT / auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

    # Symmetric encryption (Fernet) for reversible token encryption — see
    # app/utils/token_processor.py. Falls back to the JWT secret if unset.
    CRYPTOGRAPHY_SECRET: str = os.getenv("CRYPTOGRAPHY_SECRET") or os.getenv(
        "JWT_SECRET_KEY", "change-me-in-production"
    )

    # Master email kill-switch. EMAIL_ENABLED=false disables ALL outbound mail
    # everywhere — every email funnels through app/utils/email.py, which
    # short-circuits when this is off, regardless of POSTMARK_SERVER_TOKEN. Use it
    # to be 100% sure no mail leaves (e.g. local dev with a real Postmark token).
    # Defaults on so production keeps sending.
    EMAIL_ENABLED: bool = _env_bool("EMAIL_ENABLED", True)

    # Email verification master switch.
    #   True  → new accounts are auto-verified, NO email is sent, signup logs in.
    #   False → new accounts start unverified, a Postmark verification email is
    #           sent, and login is blocked until the link is clicked.
    # Defaults FROM the environment: development auto-verifies (signup works
    # without Postmark); production requires verification. An explicit
    # AUTO_VERIFY_EMAIL still overrides this default if set.
    #
    # Tied to EMAIL_ENABLED: when email sending is OFF there is no way to deliver a
    # verification link, so accounts are ALWAYS auto-verified — no confirmation
    # email is attempted at signup and the user can sign in immediately.
    AUTO_VERIFY_EMAIL: bool = (
        _env_bool("AUTO_VERIFY_EMAIL", IS_DEVELOPMENT) or not EMAIL_ENABLED
    )
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = int(
        os.getenv("EMAIL_VERIFICATION_EXPIRE_HOURS", "24")
    )
    # Password-reset links are shorter-lived than verification links by default.
    PASSWORD_RESET_EXPIRE_HOURS: int = int(
        os.getenv("PASSWORD_RESET_EXPIRE_HOURS", "2")
    )

    # Postmark transactional email (only needed when AUTO_VERIFY_EMAIL is False).
    POSTMARK_SERVER_TOKEN: str | None = os.getenv("POSTMARK_SERVER_TOKEN")
    POSTMARK_MESSAGE_STREAM: str = os.getenv("POSTMARK_MESSAGE_STREAM", "outbound")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "no-reply@ibcfasteners.com")

    # Frontend base URL — used to build the verification link inside emails.
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

    # Browser origins allowed to call this API, as a comma-separated list. The
    # local Next.js dev server is always permitted; deployments append their own
    # origin (e.g. the Cloud Run frontend URL) via the CORS_ORIGINS env var.
    # FRONTEND_BASE_URL is folded in automatically so the two can never drift.
    CORS_ORIGINS: list[str] = list(
        dict.fromkeys(
            [
                *(
                    o.strip()
                    for o in os.getenv("CORS_ORIGINS", "").split(",")
                    if o.strip()
                ),
                FRONTEND_BASE_URL,
                "http://localhost:3000",
            ]
        )
    )

    # Cloudinary (server-side). Only needed for signed operations like deleting
    # an image when a product/category is removed. The browser upload flow uses
    # the public cloud name + unsigned preset and does NOT use these.
    # The cloud name is the same value as the frontend's; the API key/secret are
    # secret and must never be exposed to the client.
    CLOUDINARY_CLOUD_NAME: str | None = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str | None = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str | None = os.getenv("CLOUDINARY_API_SECRET")

    # Google Sign-In (OAuth ID-token flow). The Web OAuth client ID from the
    # Google Cloud Console — the same value is exposed to the frontend as
    # NEXT_PUBLIC_GOOGLE_CLIENT_ID. Blank → the /auth/google endpoint is disabled
    # (returns 503), the same config-gating style as the optional Razorpay keys.
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")


settings = Settings()
