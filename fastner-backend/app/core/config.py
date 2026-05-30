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

    # Email verification master switch.
    #   True  → new accounts are auto-verified, NO email is sent, signup logs in.
    #   False → new accounts start unverified, a Postmark verification email is
    #           sent, and login is blocked until the link is clicked.
    # Defaults FROM the environment: development auto-verifies (signup works
    # without Postmark); production requires verification. An explicit
    # AUTO_VERIFY_EMAIL still overrides this default if set.
    AUTO_VERIFY_EMAIL: bool = _env_bool("AUTO_VERIFY_EMAIL", IS_DEVELOPMENT)
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = int(
        os.getenv("EMAIL_VERIFICATION_EXPIRE_HOURS", "24")
    )

    # Postmark transactional email (only needed when AUTO_VERIFY_EMAIL is False).
    POSTMARK_SERVER_TOKEN: str | None = os.getenv("POSTMARK_SERVER_TOKEN")
    POSTMARK_MESSAGE_STREAM: str = os.getenv("POSTMARK_MESSAGE_STREAM", "outbound")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "no-reply@ibcfasteners.com")

    # Frontend base URL — used to build the verification link inside emails.
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

    # Cloudinary (server-side). Only needed for signed operations like deleting
    # an image when a product/category is removed. The browser upload flow uses
    # the public cloud name + unsigned preset and does NOT use these.
    # The cloud name is the same value as the frontend's; the API key/secret are
    # secret and must never be exposed to the client.
    CLOUDINARY_CLOUD_NAME: str | None = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str | None = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str | None = os.getenv("CLOUDINARY_API_SECRET")


settings = Settings()
