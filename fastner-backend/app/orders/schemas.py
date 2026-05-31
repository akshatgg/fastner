import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PlaceOrderRequest(BaseModel):
    """Place an order from the signed-in user's current cart.

    ``address_id`` is the chosen delivery address. The Razorpay fields are sent
    only after a successful online payment; when present they're verified
    server-side and the order is marked ``paid``. Omitting them places the order
    without payment (the free-checkout fallback)."""

    address_id: uuid.UUID | None = None
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    razorpay_signature: str | None = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID | None
    product_name: str
    product_slug: str | None
    sku: str | None
    image_url: str | None
    unit_price: float | None
    quantity: int
    line_total: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    status: str
    mode: str
    subtotal: float
    address_id: uuid.UUID | None
    razorpay_payment_id: str | None
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
