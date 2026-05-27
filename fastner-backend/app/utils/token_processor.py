"""Reusable symmetric token encryption (Fernet).

Unlike one-way hashing, this is reversible — use it when you need to store a
value encrypted and read the original back later (e.g. email-verification or
password-reset tokens, third-party OAuth/API tokens kept at rest).

Usage anywhere in the app:

    from app.utils.token_processor import encrypt_token, decrypt_token

    enc = encrypt_token("some-secret-value")
    raw = decrypt_token(enc)
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


class TokenProcessor:
    """Encrypt/decrypt strings with Fernet symmetric encryption.

    The Fernet key is derived deterministically from ``CRYPTOGRAPHY_SECRET`` so
    no separate key file needs managing — rotating the secret invalidates all
    previously encrypted values.
    """

    def __init__(self) -> None:
        self._fernet = Fernet(self._derive_key())

    @staticmethod
    def _derive_key() -> bytes:
        secret = settings.CRYPTOGRAPHY_SECRET
        # Fernet needs a 32-byte url-safe base64 key; SHA-256 of the secret fits.
        return base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())

    def encrypt(self, value: str) -> str:
        """Encrypt a plaintext string, returning a url-safe token string."""
        return self._fernet.encrypt(value.encode()).decode()

    def decrypt(self, encrypted: str) -> str:
        """Decrypt a previously encrypted string.

        Raises ``cryptography.fernet.InvalidToken`` if the input was not
        produced by this key (tampered, wrong secret, or not encrypted).
        """
        return self._fernet.decrypt(encrypted.encode()).decode()


# Module-level singleton + convenience functions so callers can just import and go.
token_processor = TokenProcessor()


def encrypt_token(value: str) -> str:
    return token_processor.encrypt(value)


def decrypt_token(encrypted: str) -> str:
    return token_processor.decrypt(encrypted)


__all__ = ["TokenProcessor", "token_processor", "encrypt_token", "decrypt_token", "InvalidToken"]
