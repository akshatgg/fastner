"""Support-ticket emails — sent to the customer's account email so the whole
conversation can also happen over email. Best-effort: failures are logged, never
raised, so an SMTP hiccup doesn't break ticket creation or an admin reply.
"""

import logging

from app.auth.models import User
from app.support.models import SupportTicket
from app.utils.email import send_email

logger = logging.getLogger(__name__)

BRAND = "#f26a21"


def _shell(title: str, body_html: str) -> str:
    return f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c">
  <div style="background:#121212;padding:20px 24px">
    <span style="color:{BRAND};font-weight:bold;letter-spacing:.12em;text-transform:uppercase">IBC Fasteners Support</span>
  </div>
  <div style="padding:28px 24px;border:1px solid #eee;border-top:none">
    <h1 style="font-size:20px;margin:0 0 16px">{title}</h1>
    {body_html}
    <p style="color:#888;font-size:12px;margin-top:28px">
      Reply to this email and our team will pick it up on your ticket.
    </p>
  </div>
</div>"""


def _send(user: User, subject: str, html: str) -> None:
    try:
        send_email(to=user.email, subject=subject, html_body=html)
        logger.info("Sent support email %r to %s", subject, user.email)
    except Exception:  # noqa: BLE001 — email is best-effort
        logger.exception("Failed to send support email %r to %s", subject, user.email)


def send_ticket_opened(ticket: SupportTicket, user: User, message: str) -> None:
    body = (
        f"<p>Hi {user.full_name},</p>"
        f"<p>Thanks for reaching out — we've opened ticket "
        f"<strong>{ticket.reference}</strong> and will get back to you shortly.</p>"
        f"<p style='color:#444;border-left:3px solid #eee;padding-left:12px'>{message}</p>"
    )
    _send(user, f"[{ticket.reference}] {ticket.subject}", _shell("We've got your message", body))


def send_admin_reply(ticket: SupportTicket, user: User, message: str) -> None:
    body = (
        f"<p>Hi {user.full_name},</p>"
        f"<p>You have a new reply on ticket <strong>{ticket.reference}</strong>:</p>"
        f"<p style='color:#444;border-left:3px solid {BRAND};padding-left:12px'>{message}</p>"
    )
    _send(user, f"[{ticket.reference}] {ticket.subject}", _shell("New reply from IBC Support", body))
