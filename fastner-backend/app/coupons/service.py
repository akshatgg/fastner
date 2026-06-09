"""Coupon business logic: admin CRUD plus the validation + discount maths used
at checkout.

The discount is always computed server-side from the live cart subtotal — the
client never names its own discount. ``validate_for_subtotal`` is the single
gate every redemption path goes through (cart preview, Razorpay amount, and the
final order placement) so the rules can't drift between them.
"""

import logging
import uuid
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.coupons import schemas
from app.coupons.models import DISCOUNT_TYPES, Coupon

logger = logging.getLogger(__name__)

_TWO_PLACES = Decimal("0.01")


def normalize_code(code: str) -> str:
    return code.strip().upper()


class CouponService:
    def __init__(self, db: Session):
        self.db = db

    # --- discount maths ------------------------------------------------------

    @staticmethod
    def compute_discount(coupon: Coupon, subtotal: Decimal) -> Decimal:
        """The rupee discount this coupon applies to ``subtotal`` (never more
        than the subtotal itself)."""
        subtotal = Decimal(subtotal)
        if coupon.discount_type == "percent":
            disc = subtotal * Decimal(coupon.discount_value) / Decimal(100)
            if coupon.max_discount is not None:
                disc = min(disc, Decimal(coupon.max_discount))
        else:  # fixed
            disc = Decimal(coupon.discount_value)
        disc = min(disc, subtotal)
        return disc.quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)

    def validate_for_subtotal(self, code: str, subtotal: Decimal) -> Coupon:
        """Return the live coupon for ``code`` if it can be applied to a cart of
        ``subtotal`` right now, else raise a 400 explaining why."""
        coupon = self.db.scalar(
            select(Coupon).where(Coupon.code == normalize_code(code))
        )
        if coupon is None or not coupon.is_active:
            logger.warning(
                "Coupon validation failed: code=%s invalid or inactive.",
                normalize_code(code),
            )
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid coupon code.")
        if coupon.expires_at is not None and datetime.now(timezone.utc) > coupon.expires_at:
            logger.warning(
                "Coupon validation failed: coupon=%s code=%s has expired.",
                coupon.id,
                coupon.code,
            )
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "This coupon has expired.")
        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            logger.warning(
                "Coupon validation failed: coupon=%s code=%s usage limit reached "
                "(%d/%d).",
                coupon.id,
                coupon.code,
                coupon.used_count,
                coupon.usage_limit,
            )
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This coupon has reached its usage limit.",
            )
        if (
            coupon.min_order_amount is not None
            and Decimal(subtotal) < Decimal(coupon.min_order_amount)
        ):
            logger.warning(
                "Coupon validation failed: coupon=%s code=%s min order not met "
                "(subtotal=%s < min=%s).",
                coupon.id,
                coupon.code,
                subtotal,
                coupon.min_order_amount,
            )
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Add ₹{coupon.min_order_amount:.2f} of items to use this coupon.",
            )
        return coupon

    def preview(self, code: str, subtotal: Decimal) -> schemas.CouponPreview:
        coupon = self.validate_for_subtotal(code, subtotal)
        discount = self.compute_discount(coupon, subtotal)
        logger.info(
            "Coupon applied to cart: coupon=%s code=%s subtotal=%s discount=%s",
            coupon.id,
            coupon.code,
            subtotal,
            discount,
        )
        return schemas.CouponPreview(
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=float(coupon.discount_value),
            discount_amount=float(discount),
            message=coupon.description,
        )

    # --- admin CRUD ----------------------------------------------------------

    def _validate_discount(self, discount_type: str, discount_value: float) -> None:
        if discount_type not in DISCOUNT_TYPES:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"discount_type must be one of {', '.join(DISCOUNT_TYPES)}.",
            )
        if discount_type == "percent" and discount_value > 100:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "A percentage discount can't exceed 100%.",
            )

    def list_coupons(self) -> list[Coupon]:
        return list(
            self.db.scalars(select(Coupon).order_by(Coupon.created_at.desc())).all()
        )

    def get_coupon(self, coupon_id: uuid.UUID) -> Coupon:
        coupon = self.db.get(Coupon, coupon_id)
        if coupon is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Coupon not found.")
        return coupon

    def create_coupon(self, data: schemas.CouponCreate) -> Coupon:
        self._validate_discount(data.discount_type, data.discount_value)
        code = normalize_code(data.code)
        if self.db.scalar(select(Coupon.id).where(Coupon.code == code)):
            raise HTTPException(
                status.HTTP_409_CONFLICT, "A coupon with this code already exists."
            )
        coupon = Coupon(
            code=code,
            description=data.description,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
            max_discount=data.max_discount,
            min_order_amount=data.min_order_amount,
            usage_limit=data.usage_limit,
            expires_at=data.expires_at,
            is_active=data.is_active,
        )
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        logger.info("Coupon created: coupon=%s code=%s", coupon.id, coupon.code)
        return coupon

    def update_coupon(
        self, coupon_id: uuid.UUID, data: schemas.CouponUpdate
    ) -> Coupon:
        coupon = self.get_coupon(coupon_id)
        fields = data.model_dump(exclude_unset=True)

        new_type = fields.get("discount_type", coupon.discount_type)
        new_value = fields.get("discount_value", float(coupon.discount_value))
        if "discount_type" in fields or "discount_value" in fields:
            self._validate_discount(new_type, new_value)

        if "code" in fields and fields["code"]:
            code = normalize_code(fields["code"])
            clash = self.db.scalar(
                select(Coupon.id).where(Coupon.code == code, Coupon.id != coupon_id)
            )
            if clash:
                raise HTTPException(
                    status.HTTP_409_CONFLICT, "A coupon with this code already exists."
                )
            coupon.code = code

        for key in (
            "description",
            "discount_type",
            "discount_value",
            "max_discount",
            "min_order_amount",
            "usage_limit",
            "expires_at",
            "is_active",
        ):
            if key in fields:
                setattr(coupon, key, fields[key])

        self.db.commit()
        self.db.refresh(coupon)
        logger.info(
            "Coupon updated: coupon=%s code=%s fields=%s",
            coupon.id,
            coupon.code,
            sorted(fields.keys()),
        )
        return coupon

    def delete_coupon(self, coupon_id: uuid.UUID) -> None:
        coupon = self.get_coupon(coupon_id)
        self.db.delete(coupon)
        self.db.commit()
        logger.info("Coupon deleted: coupon=%s code=%s", coupon_id, coupon.code)

    # --- redemption bookkeeping ---------------------------------------------

    def increment_usage(self, coupon: Coupon) -> None:
        coupon.used_count = (coupon.used_count or 0) + 1
        logger.info(
            "Coupon redeemed on order: coupon=%s code=%s used_count=%d",
            coupon.id,
            coupon.code,
            coupon.used_count,
        )

    def release_usage(self, coupon_id: uuid.UUID) -> None:
        """Free a redemption back up (e.g. when an order is declined/cancelled)."""
        coupon = self.db.get(Coupon, coupon_id)
        if coupon is not None and coupon.used_count > 0:
            coupon.used_count -= 1
            logger.info(
                "Coupon redemption released: coupon=%s code=%s used_count=%d",
                coupon.id,
                coupon.code,
                coupon.used_count,
            )
