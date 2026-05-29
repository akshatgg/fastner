import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AddToCartRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(default=1, ge=1, le=9999)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=1, le=9999)


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
    created_at: datetime
    updated_at: datetime


class CartResponse(BaseModel):
    items: list[CartItemResponse] = []
    total_items: int = 0
    total_quantity: int = 0
