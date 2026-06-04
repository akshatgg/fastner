import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CouponCreate(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=255)
    discount_type: str = Field(description="'percent' or 'fixed'")
    discount_value: float = Field(gt=0)
    max_discount: float | None = Field(default=None, ge=0)
    min_order_amount: float | None = Field(default=None, ge=0)
    usage_limit: int | None = Field(default=None, ge=1)
    expires_at: datetime | None = None
    is_active: bool = True


class CouponUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=255)
    discount_type: str | None = None
    discount_value: float | None = Field(default=None, gt=0)
    max_discount: float | None = Field(default=None, ge=0)
    min_order_amount: float | None = Field(default=None, ge=0)
    usage_limit: int | None = Field(default=None, ge=1)
    expires_at: datetime | None = None
    is_active: bool | None = None


class CouponResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    description: str | None
    discount_type: str
    discount_value: float
    max_discount: float | None
    min_order_amount: float | None
    usage_limit: int | None
    used_count: int
    expires_at: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ValidateCouponRequest(BaseModel):
    code: str = Field(min_length=1, max_length=40)


class CouponPreview(BaseModel):
    """The result of validating a code against the user's current cart — the
    discount it would apply right now, ready to show in the order summary."""

    code: str
    discount_type: str
    discount_value: float
    discount_amount: float
    message: str | None = None
