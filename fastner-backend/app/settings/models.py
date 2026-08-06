import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StoreSetting(Base):
    """A single admin-editable store-wide setting, stored as a ``key`` → ``value``
    string pair so new settings can be added without a schema change.

    Today this holds the GST rate (``key='gst_rate'``, ``value='18.00'``); the
    value is always a string and parsed by the service layer to the type it
    needs. Reads fall back to a code default when a key is absent, so the table
    can start empty.
    """

    __tablename__ = "store_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class HomepageStat(Base):
    """One figure in the homepage "By the numbers" bar (e.g. "1,024+ Industries
    Served"). An admin-managed list, seeded by the service with a canonical set
    of four rows keyed by :data:`app.settings.service.STAT_KEYS`.

    Each row is either **live** or **overridden**:

      * ``manual_value IS NULL`` → the figure is computed live from the database
        (the count of industries, customers, categories or products, resolved in
        the service by ``key``), so it grows on its own.
      * ``manual_value`` set → that fixed number is shown instead (for marketing
        figures like "1,000+"). Clearing it in the admin resets the stat to live.

    ``label``/``suffix`` are editable copy; ``position`` orders the bar and
    ``is_active`` hides a stat without deleting it. The live-count logic lives in
    the service — this table only stores the admin-editable overrides.
    """

    __tablename__ = "homepage_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Canonical stat identifier (industries/customers/categories/products) — ties
    # the row to its live-count function in the service.
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    label: Mapped[str] = mapped_column(String(128), nullable=False)
    # NULL = show the live DB count; a number = fixed marketing override.
    manual_value: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Trailing flourish rendered after the number, e.g. the "+" in "1,000+".
    suffix: Mapped[str] = mapped_column(
        String(8), nullable=False, default="+", server_default="+"
    )
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
