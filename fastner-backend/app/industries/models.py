import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Industry(Base):
    """A sector shown in the "Industries We Serve" marketing section.

    A flat, admin-managed list — each row is one showcase card (name + photo +
    one-line blurb). ``position`` controls the carousel order; ``is_active``
    hides a card from the storefront without deleting it.
    """

    __tablename__ = "industries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    blurb: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
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
