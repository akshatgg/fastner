"""Razorpay payment helpers — intentionally dependency-free and config-gated.

The whole online-payment flow is **inert until two env vars are set**:

    RAZORPAY_KEY_ID       (publishable key id)
    RAZORPAY_KEY_SECRET   (server-only secret)

Set the *test* keys in the dev ``.env`` and the *live* keys in production — that
single env difference is the only switch between test and live. When the keys
are absent, ``razorpay_enabled()`` is False and checkout falls back to the
current "place order without payment" behaviour.

We talk to Razorpay over the stdlib ``urllib`` (Basic-auth REST), mirroring the
no-extra-dependency style of ``app/utils/email.py``. No SDK to install.
"""

import base64
import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request

from fastapi import HTTPException, status

RAZORPAY_API = "https://api.razorpay.com/v1"


def _key_id() -> str:
    return os.getenv("RAZORPAY_KEY_ID", "").strip()


def _key_secret() -> str:
    return os.getenv("RAZORPAY_KEY_SECRET", "").strip()


def razorpay_key_id() -> str | None:
    """The publishable key id, or None when payments aren't configured."""
    return _key_id() or None


def razorpay_enabled() -> bool:
    """True only when both the key id and secret are present."""
    return bool(_key_id() and _key_secret())


class RazorpayService:
    """Thin client over Razorpay's Orders + signature-verification flow."""

    def _require_config(self) -> None:
        if not razorpay_enabled():
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Online payment is not configured.",
            )

    def create_order(self, amount_paise: int, receipt: str | None = None) -> dict:
        """Create a Razorpay order for ``amount_paise`` (integer paise) and
        return the raw order dict (``id``, ``amount``, ``currency``, ...)."""
        self._require_config()
        if amount_paise <= 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Order amount must be greater than zero."
            )

        payload = json.dumps(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt or "",
                "payment_capture": 1,
            }
        ).encode()
        creds = base64.b64encode(
            f"{_key_id()}:{_key_secret()}".encode()
        ).decode()
        req = urllib.request.Request(
            f"{RAZORPAY_API}/orders",
            data=payload,
            headers={
                "Authorization": f"Basic {creds}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                f"Razorpay rejected the order request: {detail}",
            )
        except urllib.error.URLError as exc:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                f"Could not reach Razorpay: {exc.reason}",
            )

    def verify_signature(
        self, order_id: str, payment_id: str, signature: str
    ) -> bool:
        """Verify the checkout callback signature: HMAC-SHA256 of
        ``"{order_id}|{payment_id}"`` keyed by the secret must equal ``signature``."""
        self._require_config()
        expected = hmac.new(
            _key_secret().encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
