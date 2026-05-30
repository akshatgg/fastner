import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# The whole cart is priced in one mode at a time (see Option A in the design):
# the user picks B2C (retail) or B2B (bulk/discounted) and every line follows it.
CartMode = Literal["b2c", "b2b"]


class AddToCartRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(default=1, ge=1, le=9999)
    mode: CartMode = "b2c"


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=1, le=9999)


class SetCartModeRequest(BaseModel):
    mode: CartMode


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    # Denormalized product fields so the cart renders without extra round-trips.
    name: str
    slug: str
    image_url: str | None
    short_description: str | None
    sku: str | None
    is_active: bool
    # Pricing resolved for the cart's current mode. ``unit_price``/``line_total``
    # are null when the product has no price set for that mode.
    unit_price: float | None
    line_total: float | None
    b2b_min_qty: int
    created_at: datetime
    updated_at: datetime


class CartResponse(BaseModel):
    mode: CartMode = "b2c"
    items: list[CartItemResponse] = []
    total_items: int = 0
    total_quantity: int = 0
    subtotal: float = 0
