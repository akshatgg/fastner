"""Review HTTP routes.

  * ``GET  /reviews/products/{slug}``              — public list + rating summary
  * ``GET  /reviews/products/{slug}/eligibility``  — can the signed-in user review?
  * ``POST /reviews/products/{slug}``              — submit/update a review (buyers only)
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.database import get_db
from app.reviews import schemas
from app.reviews.service import ReviewService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/products/{slug}", response_model=schemas.ReviewListResponse)
def list_product_reviews(slug: str, db: Session = Depends(get_db)):
    """All reviews for a product plus its rating summary (public)."""
    return ReviewService(db).list_for_product(slug)


@router.get(
    "/products/{slug}/eligibility", response_model=schemas.ReviewEligibility
)
def review_eligibility(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Whether the signed-in user has bought this product and may review it."""
    return ReviewService(db).eligibility(user, slug)


@router.post(
    "/products/{slug}",
    response_model=schemas.ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_review(
    slug: str,
    data: schemas.ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update the signed-in buyer's review for this product."""
    return ReviewService(db).submit_review(user, slug, data)
