import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# A coupon discounts either a percentage of the product subtotal or a flat
# rupee amount off it.
DISCOUNT_TYPES = ("percent", "fixed")


class Coupon(Base):
    """An admin-created discount code applied to an order's product subtotal.

    Everything about a coupon is admin-controlled: the ``code``, the discount
    (``discount_type`` + ``discount_value``, with an optional ``max_discount``
    cap for percentage codes), an optional minimum order amount, how many times
    it can be redeemed in total (``usage_limit`` vs the running ``used_count``),
    when it expires (``expires_at``), and whether it's live at all
    (``is_active`` — flip it off to instantly discard the code).
    """

    __tablename__ = "coupons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Stored uppercased so lookups are case-insensitive.
    code: Mapped[str] = mapped_column(
        String(40), unique=True, index=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    discount_type: Mapped[str] = mapped_column(String(10), nullable=False)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Optional cap on the rupee discount for percentage codes (e.g. "10% up to ₹500").
    max_discount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    # Optional minimum product subtotal required to use the code.
    min_order_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    # Total redemptions allowed across all customers (NULL = unlimited).
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
