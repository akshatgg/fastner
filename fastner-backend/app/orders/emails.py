"""Order lifecycle emails.

Sent to the customer's account email at each milestone (placed, approved,
declined/refund, shipped, delivered). Best-effort: an SMTP failure is logged
but never breaks the API call that triggered it — the order state is the source
of truth, the email is a courtesy.
"""

import logging

from app.auth.models import User
from app.orders.models import Order
from app.utils.email import send_email

logger = logging.getLogger(__name__)

BRAND = "#f26a21"


def _money(value) -> str:
    return f"₹{float(value):,.2f}"


def _shell(title: str, body_html: str) -> str:
    return f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c">
  <div style="background:#121212;padding:20px 24px">
    <span style="color:{BRAND};font-weight:bold;letter-spacing:.12em;text-transform:uppercase">IBC Fasteners</span>
  </div>
  <div style="padding:28px 24px;border:1px solid #eee;border-top:none">
    <h1 style="font-size:20px;margin:0 0 16px">{title}</h1>
    {body_html}
    <p style="color:#888;font-size:12px;margin-top:28px">
      IBC Fasteners — Providing Fastening Solutions Since 1991
    </p>
  </div>
</div>"""


def _items_table(order: Order) -> str:
    rows = "".join(
        f"<tr><td style='padding:6px 0;color:#444'>{it.product_name} "
        f"<span style='color:#999'>&times;{it.quantity}</span></td>"
        f"<td style='padding:6px 0;text-align:right'>{_money(it.line_total)}</td></tr>"
        for it in order.items
    )
    return f"""\
<table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
  {rows}
  <tr><td style="padding:6px 0;border-top:1px solid #eee;color:#444">Subtotal</td>
      <td style="padding:6px 0;border-top:1px solid #eee;text-align:right">{_money(order.subtotal)}</td></tr>
  <tr><td style="padding:6px 0;color:#444">GST ({float(order.tax_rate):g}%)</td>
      <td style="padding:6px 0;text-align:right">{_money(order.tax_amount)}</td></tr>
  <tr><td style="padding:8px 0;font-weight:bold">Total</td>
      <td style="padding:8px 0;text-align:right;font-weight:bold">{_money(order.total)}</td></tr>
</table>"""


def _send(user: User, subject: str, html: str) -> None:
    try:
        send_email(to=user.email, subject=subject, html_body=html)
        logger.info("Sent order email %r to %s", subject, user.email)
    except Exception:  # noqa: BLE001 — email is best-effort, never block the request
        logger.exception("Failed to send order email %r to %s", subject, user.email)


def send_order_placed(order: Order, user: User) -> None:
    paid = order.payment_status == "paid"
    intro = (
        "We've received your payment and your order. Our team will review and "
        "approve it shortly — you'll get another email once it's confirmed."
        if paid
        else "We've received your order. Our team will review and approve it shortly."
    )
    body = (
        f"<p>Hi {user.full_name},</p>"
        f"<p>{intro}</p>"
        f"<p>Order reference: <strong>{order.reference}</strong></p>"
        f"{_items_table(order)}"
    )
    _send(user, f"Order {order.reference} received", _shell("Order received", body))


def send_order_approved(order: Order, user: User) -> None:
    eta = (
        f"<p>Expected delivery: <strong>{order.expected_delivery_date:%d %b %Y}</strong></p>"
        if order.expected_delivery_date
        else ""
    )
    body = (
        f"<p>Hi {user.full_name},</p>"
        f"<p>Good news — your order <strong>{order.reference}</strong> has been "
        f"approved and is now being processed.</p>"
        f"{eta}"
        f"{_items_table(order)}"
    )
    _send(user, f"Order {order.reference} approved", _shell("Order approved", body))


def send_order_declined(order: Order, user: User) -> None:
    refund = ""
    if order.payment_status in ("refund_initiated", "refunded"):
        refund = (
            "<p>Your payment is being refunded to the original payment method. "
            "Refunds typically settle within <strong>4–5 working days</strong>.</p>"
        )
    reason = (
        f"<p style='color:#444'>Reason: {order.decline_reason}</p>"
        if order.decline_reason
        else ""
    )
    body = (
        f"<p>Hi {user.full_name},</p>"
        f"<p>We're sorry — your order <strong>{order.reference}</strong> could not "
        f"be approved.</p>"
        f"{reason}{refund}"
        f"<p>If you have any questions, reply to this email or raise a support "
        f"ticket from your orders page.</p>"
    )
    _send(user, f"Order {order.reference} declined", _shell("Order declined", body))


def send_order_status_update(order: Order, user: User) -> None:
    label = {"shipped": "shipped", "delivered": "delivered", "cancelled": "cancelled"}.get(
        order.status, order.status
    )
    eta = (
        f"<p>Expected delivery: <strong>{order.expected_delivery_date:%d %b %Y}</strong></p>"
        if order.expected_delivery_date and order.status == "shipped"
        else ""
    )
    body = (
        f"<p>Hi {user.full_name},</p>"
        f"<p>Your order <strong>{order.reference}</strong> has been "
        f"<strong>{label}</strong>.</p>"
        f"{eta}"
    )
    _send(
        user,
        f"Order {order.reference} {label}",
        _shell(f"Order {label}", body),
    )
