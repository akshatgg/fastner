import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Address(Base):
    """A delivery address in a user's address book.

    A user can save many addresses (Amazon/Flipkart-style) and pick one at
    checkout. At most one address per user is the default (``is_default``); the
    service keeps that invariant by clearing the flag on the others whenever a
    new default is set. The FK cascades so deleting a user clears their book.
    """

    __tablename__ = "addresses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Contact details for this delivery — independent of the account, so a user
    # can ship to someone else (gift, office, site).
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    alt_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    # Postal fields, modelled on the standard Indian e-commerce address form.
    pincode: Mapped[str] = mapped_column(String(16), nullable=False)
    line1: Mapped[str] = mapped_column(String(255), nullable=False)  # Flat/House/Building
    line2: Mapped[str] = mapped_column(String(255), nullable=False)  # Area/Street/Locality
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(
        String(120), nullable=False, default="India", server_default=text("'India'")
    )

    # Optional GSTIN for B2B buyers who need a tax invoice.
    gst_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # "home" | "work" | "other" — a label, like Amazon's address tags.
    address_type: Mapped[str] = mapped_column(
        String(16), nullable=False, default="home", server_default=text("'home'")
    )
    is_default: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
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
