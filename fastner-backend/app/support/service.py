"""Support-ticket business logic.

A ticket is a threaded conversation between a customer and the IBC team. Customers
open tickets (optionally tied to one of their orders) and reply; admins reply and
move the ticket through its status. Every admin reply is emailed to the customer's
account email, so the conversation also lives in their inbox.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.models import User
from app.orders.models import Order
from app.support import emails, schemas
from app.support.models import TICKET_STATUSES, SupportTicket, TicketMessage


class SupportService:
    def __init__(self, db: Session):
        self.db = db

    # --- response builders ---------------------------------------------------

    @staticmethod
    def to_response(ticket: SupportTicket) -> schemas.TicketResponse:
        resp = schemas.TicketResponse.model_validate(ticket, from_attributes=True)
        if ticket.order is not None:
            resp.order_reference = ticket.order.reference
        return resp

    @staticmethod
    def to_admin_response(ticket: SupportTicket) -> schemas.AdminTicketResponse:
        resp = schemas.AdminTicketResponse.model_validate(ticket, from_attributes=True)
        if ticket.order is not None:
            resp.order_reference = ticket.order.reference
        if ticket.user is not None:
            resp.customer_name = ticket.user.full_name
            resp.customer_email = ticket.user.email
        return resp

    # --- customer ------------------------------------------------------------

    def create_ticket(
        self, user: User, data: schemas.CreateTicketRequest
    ) -> SupportTicket:
        order_id = None
        if data.order_id is not None:
            order = self.db.get(Order, data.order_id)
            if order is None or order.user_id != user.id:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found.")
            order_id = order.id

        ticket = SupportTicket(
            reference="",  # set from the id once assigned
            user_id=user.id,
            order_id=order_id,
            subject=data.subject.strip(),
            category=(data.category or "general").strip() or "general",
            status="open",
        )
        self.db.add(ticket)
        self.db.flush()  # assign ticket.id
        ticket.reference = f"TKT-{ticket.id.hex[:8].upper()}"
        self.db.add(
            TicketMessage(
                ticket_id=ticket.id, author_role="user", body=data.message.strip()
            )
        )
        self.db.commit()
        self.db.refresh(ticket)
        emails.send_ticket_opened(ticket, user, data.message.strip())
        return ticket

    def list_my_tickets(self, user_id: uuid.UUID) -> list[SupportTicket]:
        return list(
            self.db.scalars(
                select(SupportTicket)
                .where(SupportTicket.user_id == user_id)
                .order_by(SupportTicket.updated_at.desc())
            ).all()
        )

    def get_my_ticket(
        self, user_id: uuid.UUID, ticket_id: uuid.UUID
    ) -> SupportTicket:
        ticket = self.db.get(SupportTicket, ticket_id)
        if ticket is None or ticket.user_id != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found.")
        return ticket

    def add_user_message(
        self, user: User, ticket_id: uuid.UUID, body: str
    ) -> SupportTicket:
        ticket = self.get_my_ticket(user.id, ticket_id)
        self.db.add(
            TicketMessage(
                ticket_id=ticket.id, author_role="user", body=body.strip()
            )
        )
        # A customer reply reopens a resolved/closed ticket so it's seen again.
        if ticket.status in ("resolved", "closed"):
            ticket.status = "open"
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    # --- admin ---------------------------------------------------------------

    def _get_any_ticket(self, ticket_id: uuid.UUID) -> SupportTicket:
        ticket = self.db.get(SupportTicket, ticket_id)
        if ticket is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found.")
        return ticket

    def list_all_tickets(self, status_filter: str | None = None) -> list[SupportTicket]:
        q = select(SupportTicket).order_by(SupportTicket.updated_at.desc())
        if status_filter:
            q = q.where(SupportTicket.status == status_filter)
        return list(self.db.scalars(q).all())

    def get_ticket(self, ticket_id: uuid.UUID) -> SupportTicket:
        return self._get_any_ticket(ticket_id)

    def add_admin_reply(self, ticket_id: uuid.UUID, body: str) -> SupportTicket:
        ticket = self._get_any_ticket(ticket_id)
        self.db.add(
            TicketMessage(
                ticket_id=ticket.id, author_role="admin", body=body.strip()
            )
        )
        if ticket.status == "open":
            ticket.status = "in_progress"
        self.db.commit()
        self.db.refresh(ticket)
        emails.send_admin_reply(ticket, ticket.user, body.strip())
        return ticket

    def set_status(self, ticket_id: uuid.UUID, new_status: str) -> SupportTicket:
        if new_status not in TICKET_STATUSES:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Status must be one of {', '.join(TICKET_STATUSES)}.",
            )
        ticket = self._get_any_ticket(ticket_id)
        ticket.status = new_status
        self.db.commit()
        self.db.refresh(ticket)
        return ticket
