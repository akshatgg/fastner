"""Transactional email sending over SMTP.

Sends via the stdlib ``smtplib`` (STARTTLS) — e.g. Gmail with a 16-char App
Password — so no third-party dependency is added. When SMTP is not configured
(typical local dev with ``AUTO_VERIFY_EMAIL=True``) the message is logged
instead of sent so flows keep working without email wired up. ``EMAIL_ENABLED``
is a global kill-switch that disables all outbound mail.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    *,
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
) -> None:
    """Send a single transactional email over SMTP.

    Raises on a transport error so callers can decide how to react. If
    ``EMAIL_ENABLED`` is false, sending is disabled globally and the call is a
    no-op. If ``SMTP_HOST`` is unset, the message is logged instead of sent
    (dev fallback) so flows keep working without SMTP wired up.
    """
    # Master kill-switch: when email is disabled, no message ever leaves — this
    # gate covers every flow (verification, password reset, orders, support).
    if not settings.EMAIL_ENABLED:
        logger.info(
            "Email disabled (EMAIL_ENABLED=false) — skipping send to %s: %r", to, subject
        )
        return

    if not settings.SMTP_HOST:
        logger.warning(
            "SMTP_HOST not set — not sending. Email to %s: %r", to, subject
        )
        logger.info("Email body:\n%s", text_body or html_body)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    # Attach the plain-text alternative first (lower priority), then the HTML.
    if text_body:
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            if settings.SMTP_USE_TLS:
                server.starttls()
                server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
        logger.info("Sent email to %s via SMTP: %r", to, subject)
    except (smtplib.SMTPException, OSError) as exc:
        logger.error("SMTP send failed: %s", exc)
        raise
