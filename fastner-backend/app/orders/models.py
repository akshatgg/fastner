import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Fulfilment lifecycle. Every order starts ``pending_approval`` — payment may
# already be captured, but an admin must approve before it proceeds. From there
# it moves to ``approved`` → ``shipped`` → ``delivered``, or is ``declined``
# (admin rejects; any captured payment is refunded) / ``cancelled``.
# Anything except declined/cancelled counts as a real purchase for review
# eligibility (mirrors the old "placed counts" behaviour).
ORDER_STATUSES = (
    "pending_approval",
    "approved",
    "shipped",
    "delivered",
    "declined",
    "cancelled",
)
PURCHASED_STATUSES = ("pending_approval", "approved", "shipped", "delivered")
# Orders still "in flight". Used to block account deletion while the user has an
# open order — the terminal states (delivered / declined / cancelled) don't block.
ACTIVE_STATUSES = ("pending_approval", "approved", "shipped")

# Payment lifecycle, tracked independently of fulfilment. ``paid`` once Razorpay
# verifies; ``refund_initiated`` when a paid order is declined (Razorpay refund
# requested, settles in 4–5 working days); ``refunded`` once settled.
PAYMENT_STATUSES = ("unpaid", "paid", "refund_initiated", "refunded")


class Order(Base):
    """A placed order — a persisted snapshot of the user's cart at checkout.

    Orders are the source of truth for "did this user buy this product", which
    gates product reviews (verified-purchase). The line items snapshot the
    product name/price at purchase time so the order history stays correct even
    if the catalog later changes. ``address_id`` is kept as a soft link (SET
    NULL) so deleting a saved address doesn't erase order history.
    """

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Human-facing reference, e.g. "IBC-1A2B3C4D". Derived from the id.
    reference: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    address_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("addresses.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending_approval",
        server_default=text("'pending_approval'"),
    )
    # Payment lifecycle, independent of fulfilment status (see PAYMENT_STATUSES).
    payment_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="unpaid",
        server_default=text("'unpaid'"),
    )
    # Pricing mode the order was placed in (b2c retail / b2b bulk).
    mode: Mapped[str] = mapped_column(
        String(8), nullable=False, default="b2c", server_default=text("'b2c'")
    )
    # Money snapshot at checkout. ``subtotal`` is the product total; ``tax_rate``
    # is the GST % applied; ``tax_amount`` = subtotal × rate; ``total`` is what
    # the customer pays (subtotal + tax).
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Coupon applied at checkout (soft link + snapshot of the code/amount so the
    # order stays correct even if the coupon is later edited or deleted).
    coupon_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="SET NULL"),
        nullable=True,
    )
    coupon_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, server_default=text("0")
    )
    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=0, server_default=text("0")
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, server_default=text("0")
    )
    total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, server_default=text("0")
    )
    # Admin-set expected delivery date, surfaced to the customer.
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Reason captured when an admin declines the order (shown to the customer).
    decline_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Razorpay references, when the order was paid online.
    razorpay_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    razorpay_refund_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )
    # One-directional link to the buyer — used by the admin order views to show
    # who placed the order and where to email status updates. Resolved by class
    # name from the shared registry.
    user: Mapped["User"] = relationship(lazy="joined")  # type: ignore[name-defined]  # noqa: F821


class OrderItem(Base):
    """One line of an :class:`Order` — a product, quantity, and the prices that
    applied at purchase time (snapshotted, not derived from the live product)."""

    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Soft link: keep the line (with its snapshot) even if the product is gone.
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
