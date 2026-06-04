import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Ticket lifecycle. "open" = awaiting our reply; "in_progress" = we've responded
# and are working it; "resolved"/"closed" = done.
TICKET_STATUSES = ("open", "in_progress", "resolved", "closed")
# Who wrote a given message in the thread.
MESSAGE_AUTHORS = ("user", "admin")


class SupportTicket(Base):
    """A customer support request — a threaded conversation between the customer
    and the IBC team. A ticket may be tied to a specific order (raised from the
    "my orders" page) or be a general enquiry. Replies are emailed to the
    customer's account email, so the whole exchange can happen over email too.
    """

    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Human-facing reference, e.g. "TKT-1A2B3C4D".
    reference: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Optional soft link to an order (SET NULL keeps the ticket if the order goes).
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(
        String(32), nullable=False, default="general", server_default=text("'general'")
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="open", server_default=text("'open'")
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

    messages: Mapped[list["TicketMessage"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="TicketMessage.created_at",
    )
    user: Mapped["User"] = relationship(lazy="joined")  # type: ignore[name-defined]  # noqa: F821
    order: Mapped["Order | None"] = relationship(lazy="joined")  # type: ignore[name-defined]  # noqa: F821


class TicketMessage(Base):
    """One message in a :class:`SupportTicket` thread, from the customer or an admin."""

    __tablename__ = "ticket_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("support_tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_role: Mapped[str] = mapped_column(String(8), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket: Mapped["SupportTicket"] = relationship(back_populates="messages")
