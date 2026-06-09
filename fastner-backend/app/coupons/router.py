"""Coupon HTTP routes.

  * ``router`` (/coupons) — signed-in customers validate a code against their
    current cart to preview the discount before checkout.
  * ``admin_router`` (/admin/coupons) — full CRUD; flip ``is_active`` to discard
    a code instantly.
"""

import logging
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.cart.service import CartService
from app.core.database import get_db
from app.coupons import schemas
from app.coupons.service import CouponService
from app.utils.dependencies import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/coupons", tags=["coupons"])

admin_router = APIRouter(
    prefix="/admin/coupons",
    tags=["coupons-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)


@router.post("/validate", response_model=schemas.CouponPreview)
def validate_coupon(
    data: schemas.ValidateCouponRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Validate a coupon against the signed-in user's current cart subtotal and
    return the discount it would apply."""
    cart = CartService(db).get_cart(user.id)
    return CouponService(db).preview(data.code, Decimal(str(cart.subtotal)))


# ============================ ADMIN ============================


@admin_router.get("", response_model=list[schemas.CouponResponse])
def list_coupons(db: Session = Depends(get_db)):
    return CouponService(db).list_coupons()


@admin_router.post(
    "", response_model=schemas.CouponResponse, status_code=status.HTTP_201_CREATED
)
def create_coupon(data: schemas.CouponCreate, db: Session = Depends(get_db)):
    logger.info("Admin create coupon code=%s", data.code)
    return CouponService(db).create_coupon(data)


@admin_router.get("/{coupon_id}", response_model=schemas.CouponResponse)
def get_coupon(coupon_id: uuid.UUID, db: Session = Depends(get_db)):
    return CouponService(db).get_coupon(coupon_id)


@admin_router.put("/{coupon_id}", response_model=schemas.CouponResponse)
def update_coupon(
    coupon_id: uuid.UUID, data: schemas.CouponUpdate, db: Session = Depends(get_db)
):
    logger.info("Admin update coupon id=%s", coupon_id)
    return CouponService(db).update_coupon(coupon_id, data)


@admin_router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(coupon_id: uuid.UUID, db: Session = Depends(get_db)):
    logger.info("Admin delete coupon id=%s", coupon_id)
    CouponService(db).delete_coupon(coupon_id)
