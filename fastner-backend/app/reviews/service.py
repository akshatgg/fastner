"""Review business logic.

Any signed-in user may write one review per product (submitting again updates
their existing one). Whether the author actually bought the product is surfaced
as a "verified purchase" badge — computed against the orders tables — but is no
longer required to review.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.models import User
from app.catalog.models import Product
from app.orders.service import OrderService
from app.reviews import schemas
from app.reviews.models import Review


class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def _get_product(self, slug: str) -> Product:
        product = self.db.scalar(select(Product).where(Product.slug == slug))
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found.")
        return product

    def _to_response(
        self, review: Review, verified: bool
    ) -> schemas.ReviewResponse:
        return schemas.ReviewResponse(
            id=review.id,
            rating=review.rating,
            title=review.title,
            body=review.body,
            media=[schemas.ReviewMedia(**m) for m in (review.media or [])],
            author_name=review.user.full_name if review.user else "Customer",
            verified_purchase=verified,
            created_at=review.created_at,
        )

    def _reviews_for(self, product_id: uuid.UUID) -> list[Review]:
        return list(
            self.db.scalars(
                select(Review)
                .where(Review.product_id == product_id)
                .order_by(Review.created_at.desc())
            ).all()
        )

    def list_for_product(self, slug: str) -> schemas.ReviewListResponse:
        product = self._get_product(slug)
        reviews = self._reviews_for(product.id)
        orders = OrderService(self.db)

        distribution = {str(i): 0 for i in range(1, 6)}
        for r in reviews:
            distribution[str(r.rating)] += 1
        count = len(reviews)
        average = round(sum(r.rating for r in reviews) / count, 2) if count else 0
        # Percentages per star, rounded to one decimal (e.g. 44.0).
        distribution_pct = {
            star: (round(n / count * 100, 1) if count else 0.0)
            for star, n in distribution.items()
        }

        items = [
            self._to_response(
                r, verified=orders.has_purchased(r.user_id, product.id)
            )
            for r in reviews
        ]
        return schemas.ReviewListResponse(
            summary=schemas.RatingSummary(
                average=average,
                count=count,
                distribution=distribution,
                distribution_pct=distribution_pct,
            ),
            items=items,
        )

    def _my_review(
        self, user_id: uuid.UUID, product_id: uuid.UUID
    ) -> Review | None:
        return self.db.scalar(
            select(Review).where(
                Review.user_id == user_id, Review.product_id == product_id
            )
        )

    def eligibility(self, user: User, slug: str) -> schemas.ReviewEligibility:
        product = self._get_product(slug)
        existing = self._my_review(user.id, product.id)
        verified = OrderService(self.db).has_purchased(user.id, product.id)
        return schemas.ReviewEligibility(
            can_review=True,  # any signed-in user may review
            already_reviewed=existing is not None,
            verified_purchase=verified,
            my_review=self._to_response(existing, verified) if existing else None,
        )

    def submit_review(
        self, user: User, slug: str, data: schemas.ReviewCreate
    ) -> schemas.ReviewResponse:
        product = self._get_product(slug)

        existing = self._my_review(user.id, product.id)
        media = [m.model_dump() for m in data.media]
        if existing is not None:
            existing.rating = data.rating
            existing.title = data.title
            existing.body = data.body
            existing.media = media
            review = existing
        else:
            review = Review(
                product_id=product.id,
                user_id=user.id,
                rating=data.rating,
                title=data.title,
                body=data.body,
                media=media,
            )
            self.db.add(review)

        self.db.commit()
        self.db.refresh(review)
        verified = OrderService(self.db).has_purchased(user.id, product.id)
        return self._to_response(review, verified)
