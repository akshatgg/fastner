"""Transactional email sending via Postmark.

Talks to Postmark's REST API over the stdlib ``urllib`` so we add no new
dependency. When no server token is configured (typical local dev with
``AUTO_VERIFY_EMAIL=True``), the message is logged instead of sent so flows keep
working without Postmark wired up.
"""

import json
import logging
import urllib.error
import urllib.request

from app.core.config import settings

logger = logging.getLogger(__name__)

POSTMARK_API_URL = "https://api.postmarkapp.com/email"


def send_email(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
) -> None:
    """Send a single transactional email through Postmark.

    Raises on a Postmark/transport error so callers can decide how to react.
    If ``POSTMARK_SERVER_TOKEN`` is unset, logs the message and returns without
    sending (dev fallback).
    """
    if not settings.POSTMARK_SERVER_TOKEN:
        logger.warning(
            "POSTMARK_SERVER_TOKEN not set — not sending. Email to %s: %r", to, subject
        )
        logger.info("Email body:\n%s", text_body or html_body)
        return

    payload: dict[str, str] = {
        "From": settings.EMAIL_FROM,
        "To": to,
        "Subject": subject,
        "HtmlBody": html_body,
        "MessageStream": settings.POSTMARK_MESSAGE_STREAM,
    }
    if text_body:
        payload["TextBody"] = text_body

    request = urllib.request.Request(
        POSTMARK_API_URL,
        data=json.dumps(payload).encode(),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": settings.POSTMARK_SERVER_TOKEN,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            resp.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        logger.error("Postmark send failed (HTTP %s): %s", exc.code, detail)
        raise
    except urllib.error.URLError as exc:
        logger.error("Postmark request failed: %s", exc)
        raise
