import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PlaceOrderRequest(BaseModel):
    """Place an order from the signed-in user's current cart.

    ``address_id`` is the chosen delivery address. The Razorpay fields are sent
    only after a successful online payment; when present they're verified
    server-side and the order is marked ``paid`` (still ``pending_approval``
    until an admin approves it). Omitting them places the order without payment
    (the free-checkout fallback)."""

    address_id: uuid.UUID | None = None
    coupon_code: str | None = None
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
    payment_status: str
    mode: str
    subtotal: float
    coupon_code: str | None
    discount_amount: float
    tax_rate: float
    tax_amount: float
    total: float
    expected_delivery_date: date | None
    decline_reason: str | None
    address_id: uuid.UUID | None
    razorpay_payment_id: str | None
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime


# ============================ ADMIN ============================


class AdminOrderResponse(OrderResponse):
    """An order enriched with the buyer's identity for the admin order desk."""

    customer_name: str | None = None
    customer_email: str | None = None


class ApproveOrderRequest(BaseModel):
    """Approve a pending order. Optionally set the expected delivery date that
    the customer will see."""

    expected_delivery_date: date | None = None


class DeclineOrderRequest(BaseModel):
    """Decline a pending order. The reason is shown to the customer, and any
    captured payment is refunded (4–5 working days)."""

    reason: str = Field(min_length=1, max_length=512)


class UpdateOrderStatusRequest(BaseModel):
    """Advance an order's fulfilment status (e.g. shipped/delivered/cancelled)."""

    status: str
    expected_delivery_date: date | None = None


class SetExpectedDeliveryRequest(BaseModel):
    expected_delivery_date: date | None = None
