import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreateTicketRequest(BaseModel):
    """Open a new support ticket. ``order_id`` links it to one of the user's
    orders (when raised from the orders page); ``category`` is a free hint like
    "order", "payment", "product" or "general"."""

    subject: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1)
    category: str = Field(default="general", max_length=32)
    order_id: uuid.UUID | None = None


class AddMessageRequest(BaseModel):
    body: str = Field(min_length=1)


class UpdateTicketStatusRequest(BaseModel):
    status: str


class TicketMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_role: str
    body: str
    created_at: datetime


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    subject: str
    category: str
    status: str
    order_id: uuid.UUID | None
    order_reference: str | None = None
    messages: list[TicketMessageResponse] = []
    created_at: datetime
    updated_at: datetime


class AdminTicketResponse(TicketResponse):
    """A ticket enriched with the customer's identity for the admin inbox."""

    customer_name: str | None = None
    customer_email: str | None = None
