"""Support-ticket HTTP routes.

  * ``router`` (/support) — the signed-in customer's own tickets.
  * ``admin_router`` (/admin/support) — the support inbox: read every ticket,
    reply (emailing the customer), and move tickets through their status.
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.database import get_db
from app.support import schemas
from app.support.service import SupportService
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/support", tags=["support"])

admin_router = APIRouter(
    prefix="/admin/support",
    tags=["support-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)


# ============================ CUSTOMER ============================


@router.post(
    "/tickets", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED
)
def create_ticket(
    data: schemas.CreateTicketRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Open a new support ticket (optionally linked to one of your orders)."""
    svc = SupportService(db)
    return svc.to_response(svc.create_ticket(user, data))


@router.get("/tickets", response_model=list[schemas.TicketResponse])
def list_my_tickets(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Your support tickets, most recently updated first."""
    svc = SupportService(db)
    return [svc.to_response(t) for t in svc.list_my_tickets(user.id)]


@router.get("/tickets/{ticket_id}", response_model=schemas.TicketResponse)
def get_my_ticket(
    ticket_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = SupportService(db)
    return svc.to_response(svc.get_my_ticket(user.id, ticket_id))


@router.post("/tickets/{ticket_id}/messages", response_model=schemas.TicketResponse)
def add_my_message(
    ticket_id: uuid.UUID,
    data: schemas.AddMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reply on one of your tickets."""
    svc = SupportService(db)
    return svc.to_response(svc.add_user_message(user, ticket_id, data.body))


# ============================ ADMIN ============================


@admin_router.get("/tickets", response_model=list[schemas.AdminTicketResponse])
def admin_list_tickets(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    """Every ticket, optionally filtered by status."""
    svc = SupportService(db)
    return [svc.to_admin_response(t) for t in svc.list_all_tickets(status_filter)]


@admin_router.get("/tickets/{ticket_id}", response_model=schemas.AdminTicketResponse)
def admin_get_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db)):
    svc = SupportService(db)
    return svc.to_admin_response(svc.get_ticket(ticket_id))


@admin_router.post("/tickets/{ticket_id}/reply", response_model=schemas.AdminTicketResponse)
def admin_reply(
    ticket_id: uuid.UUID,
    data: schemas.AddMessageRequest,
    db: Session = Depends(get_db),
):
    """Reply to a ticket — the message is emailed to the customer."""
    svc = SupportService(db)
    return svc.to_admin_response(svc.add_admin_reply(ticket_id, data.body))


@admin_router.patch("/tickets/{ticket_id}/status", response_model=schemas.AdminTicketResponse)
def admin_set_status(
    ticket_id: uuid.UUID,
    data: schemas.UpdateTicketStatusRequest,
    db: Session = Depends(get_db),
):
    svc = SupportService(db)
    return svc.to_admin_response(svc.set_status(ticket_id, data.status))
