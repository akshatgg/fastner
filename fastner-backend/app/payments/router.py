"""Payment HTTP routes (Razorpay).

These are live only once ``RAZORPAY_KEY_ID`` / ``RAZORPAY_KEY_SECRET`` are set
(test keys on dev, live keys on prod). Until then ``/payments/config`` reports
``enabled: false`` and the storefront keeps placing orders without payment.

The order amount is always computed server-side from the user's cart — the
client never gets to name its own price.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.cart.service import CartService
from app.core.database import get_db
from app.coupons.service import CouponService
from app.orders.service import compute_money
from app.payments import schemas
from app.payments.service import (
    RazorpayService,
    razorpay_enabled,
    razorpay_key_id,
)
from app.settings.service import SettingsService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/config", response_model=schemas.PaymentConfigResponse)
def payment_config():
    """Whether online payment is configured, plus the publishable key id."""
    return schemas.PaymentConfigResponse(
        enabled=razorpay_enabled(), key_id=razorpay_key_id()
    )


@router.post("/razorpay/order", response_model=schemas.CreateOrderResponse)
def create_razorpay_order(
    data: schemas.CreateOrderRequest | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Razorpay order for the signed-in user's cart total *including
    GST and any coupon discount* — the same total the order is later persisted
    with."""
    cart = CartService(db).get_cart(user.id)
    if cart.subtotal <= 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Your cart has no payable total yet.",
        )
    subtotal = Decimal(str(cart.subtotal))

    # Apply the same coupon the order will be placed with so the charged amount
    # matches the persisted order total exactly.
    raw_discount = Decimal(0)
    if data and data.coupon_code:
        coupon = CouponService(db).validate_for_subtotal(data.coupon_code, subtotal)
        raw_discount = CouponService.compute_discount(coupon, subtotal)

    gst_rate = SettingsService(db).get_gst_rate()
    _discount, _tax, total = compute_money(subtotal, raw_discount, gst_rate)
    amount_paise = int((total * 100).to_integral_value())
    # Razorpay caps receipt at 40 chars — the dashless hex (5 + 32 = 37) fits.
    order = RazorpayService().create_order(
        amount_paise, receipt=f"cart-{user.id.hex}"
    )
    return schemas.CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=razorpay_key_id() or "",
    )


@router.post("/razorpay/verify", response_model=schemas.VerifyPaymentResponse)
def verify_razorpay_payment(
    data: schemas.VerifyPaymentRequest,
    user: User = Depends(get_current_user),
):
    """Verify the Checkout callback signature after a successful payment."""
    ok = RazorpayService().verify_signature(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
    )
    if not ok:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Payment verification failed."
        )
    return schemas.VerifyPaymentResponse(verified=True)
