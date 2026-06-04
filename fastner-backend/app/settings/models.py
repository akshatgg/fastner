import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
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
