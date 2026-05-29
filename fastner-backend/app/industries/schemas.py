import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IndustryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    # Optional: auto-derived from name when omitted.
    slug: str | None = Field(default=None, max_length=255)
    blurb: str | None = Field(default=None, max_length=512)
    image_url: str | None = Field(default=None, max_length=1024)
    position: int = 0
    is_active: bool = True


class IndustryUpdate(BaseModel):
    """All fields optional — only those provided are changed."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    blurb: str | None = Field(default=None, max_length=512)
    image_url: str | None = Field(default=None, max_length=1024)
    position: int | None = None
    is_active: bool | None = None


class IndustryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    blurb: str | None
    image_url: str | None
    position: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
