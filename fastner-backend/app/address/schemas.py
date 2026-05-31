import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# The label shown against a saved address, mirroring Amazon/Flipkart tags.
AddressType = Literal["home", "work", "other"]


class AddressBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=4, max_length=32)
    alt_phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    pincode: str = Field(min_length=3, max_length=16)
    line1: str = Field(min_length=1, max_length=255)
    line2: str = Field(min_length=1, max_length=255)
    landmark: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    country: str = Field(default="India", min_length=1, max_length=120)
    gst_number: str | None = Field(default=None, max_length=20)
    address_type: AddressType = "home"
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(AddressBase):
    pass


class AddressResponse(AddressBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
