from pydantic import BaseModel


class PaymentConfigResponse(BaseModel):
    """Tells the frontend whether to run the Razorpay flow. ``key_id`` is the
    publishable key — safe to expose — and is null when payments are disabled."""

    enabled: bool
    key_id: str | None = None


class CreateOrderRequest(BaseModel):
    """Optional coupon to apply when computing the amount to charge."""

    coupon_code: str | None = None


class CreateOrderResponse(BaseModel):
    """A freshly created Razorpay order, ready to hand to Checkout.js."""

    order_id: str
    amount: int  # in paise
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    verified: bool
