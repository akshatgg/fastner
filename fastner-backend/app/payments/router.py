"""Payment HTTP routes (Razorpay).

These are live only once ``RAZORPAY_KEY_ID`` / ``RAZORPAY_KEY_SECRET`` are set
(test keys on dev, live keys on prod). Until then ``/payments/config`` reports
``enabled: false`` and the storefront keeps placing orders without payment.

The order amount is always computed server-side from the user's cart — the
client never gets to name its own price.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.cart.service import CartService
from app.core.database import get_db
from app.payments import schemas
from app.payments.service import (
    RazorpayService,
    razorpay_enabled,
    razorpay_key_id,
)
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
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Create a Razorpay order for the signed-in user's current cart total."""
    cart = CartService(db).get_cart(user.id)
    if cart.subtotal <= 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Your cart has no payable total yet.",
        )
    amount_paise = int(round(cart.subtotal * 100))
    order = RazorpayService().create_order(
        amount_paise, receipt=f"cart-{user.id}"
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
