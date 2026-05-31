import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ReviewMedia(BaseModel):
    """A single customer photo or video attached to a review."""

    url: str = Field(max_length=1024)
    type: Literal["image", "video"] = "image"


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=255)
    body: str | None = Field(default=None, max_length=4000)
    # Up to 8 photos/videos per review (uploaded client-side to Cloudinary).
    media: list[ReviewMedia] = Field(default_factory=list, max_length=8)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rating: int
    title: str | None
    body: str | None
    media: list[ReviewMedia] = Field(default_factory=list)
    author_name: str
    # True when this author actually bought the product (shows a badge).
    verified_purchase: bool = False
    created_at: datetime


class RatingSummary(BaseModel):
    """Average rating, total count, and a 1–5 star histogram with percentages."""

    average: float = 0
    count: int = 0
    # Counts keyed by star value as a string ("1".."5").
    distribution: dict[str, int] = Field(
        default_factory=lambda: {str(i): 0 for i in range(1, 6)}
    )
    # Percentage of reviews at each star (0–100), same keys as ``distribution``.
    distribution_pct: dict[str, float] = Field(
        default_factory=lambda: {str(i): 0.0 for i in range(1, 6)}
    )


class ReviewListResponse(BaseModel):
    summary: RatingSummary
    items: list[ReviewResponse] = []


class ReviewEligibility(BaseModel):
    """The signed-in user's review state for this product. Any signed-in user
    may review now, so ``can_review`` is true whenever authenticated; the rest
    lets the UI prefill an existing review for editing."""

    can_review: bool = True
    already_reviewed: bool = False
    verified_purchase: bool = False
    my_review: ReviewResponse | None = None
