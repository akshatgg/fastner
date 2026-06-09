"""Order business logic: turn a user's cart into a persisted order, then move it
through its approval/fulfilment lifecycle.

An order is a point-in-time snapshot of the cart (items + prices) plus the GST
applied at checkout, so it stays correct even if the catalog or tax rate changes
later. Placing an order optionally verifies a Razorpay payment (marking it
``paid``); either way the order starts ``pending_approval`` and the cart is
emptied. An admin then approves it (optionally with an expected delivery date)
or declines it (refunding any captured payment).

Orders also answer "has this user bought this product?" via
:meth:`OrderService.has_purchased`, which gates verified-purchase reviews.
"""

import logging
import uuid
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.address.models import Address
from app.auth.models import User
from app.cart.service import CartService
from app.coupons.service import CouponService
from app.orders import emails, schemas
from app.orders.models import PURCHASED_STATUSES, Order, OrderItem
from app.payments.service import RazorpayService, razorpay_enabled
from app.settings.service import SettingsService

logger = logging.getLogger(__name__)

_TWO_PLACES = Decimal("0.01")


def compute_money(
    subtotal: Decimal, discount: Decimal, gst_rate: Decimal
) -> tuple[Decimal, Decimal, Decimal]:
    """Return ``(discount, tax_amount, total)`` for a product ``subtotal`` with an
    optional coupon ``discount``. GST is applied on the **post-discount** taxable
    amount (subtotal − discount) and everything is rounded to paise. The returned
    discount is clamped so it never exceeds the subtotal."""
    subtotal = Decimal(subtotal)
    discount = min(Decimal(discount), subtotal).quantize(_TWO_PLACES)
    taxable = subtotal - discount
    tax_amount = (taxable * Decimal(gst_rate) / Decimal(100)).quantize(
        _TWO_PLACES, rounding=ROUND_HALF_UP
    )
    total = (taxable + tax_amount).quantize(_TWO_PLACES)
    return discount, tax_amount, total


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    # --- placing -------------------------------------------------------------

    def place_order(self, user: User, data: schemas.PlaceOrderRequest) -> Order:
        cart = CartService(self.db).get_cart(user.id)
        if not cart.items:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your cart is empty.")
        if cart.subtotal <= 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Your cart has no payable total yet."
            )

        # Validate the chosen delivery address belongs to this user.
        if data.address_id is not None:
            address = self.db.get(Address, data.address_id)
            if address is None or address.user_id != user.id:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found.")

        # If payment details are present, verify them and mark the order paid.
        payment_status = "unpaid"
        rzp_order_id = None
        rzp_payment_id = None
        if any(
            (data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature)
        ):
            if not (
                data.razorpay_order_id
                and data.razorpay_payment_id
                and data.razorpay_signature
            ):
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, "Incomplete payment details."
                )
            ok = RazorpayService().verify_signature(
                data.razorpay_order_id,
                data.razorpay_payment_id,
                data.razorpay_signature,
            )
            if not ok:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, "Payment verification failed."
                )
            payment_status = "paid"
            rzp_order_id = data.razorpay_order_id
            rzp_payment_id = data.razorpay_payment_id

        # Apply a coupon (validated + priced server-side) and snapshot GST at
        # checkout — GST is charged on the post-discount amount.
        subtotal = Decimal(str(cart.subtotal))
        coupon = None
        raw_discount = Decimal(0)
        if data.coupon_code:
            coupon = CouponService(self.db).validate_for_subtotal(
                data.coupon_code, subtotal
            )
            raw_discount = CouponService.compute_discount(coupon, subtotal)

        gst_rate = SettingsService(self.db).get_gst_rate()
        discount, tax_amount, total = compute_money(subtotal, raw_discount, gst_rate)

        order = Order(
            reference="",  # set from the id once it's assigned
            user_id=user.id,
            address_id=data.address_id,
            status="pending_approval",
            payment_status=payment_status,
            mode=cart.mode,
            subtotal=subtotal,
            coupon_id=coupon.id if coupon else None,
            coupon_code=coupon.code if coupon else None,
            discount_amount=discount,
            tax_rate=gst_rate,
            tax_amount=tax_amount,
            total=total,
            razorpay_order_id=rzp_order_id,
            razorpay_payment_id=rzp_payment_id,
        )
        if coupon is not None:
            CouponService(self.db).increment_usage(coupon)
        self.db.add(order)
        self.db.flush()  # assign order.id
        order.reference = f"IBC-{order.id.hex[:8].upper()}"

        for it in cart.items:
            self.db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=it.product_id,
                    product_name=it.name,
                    product_slug=it.slug,
                    sku=it.sku,
                    image_url=it.image_url,
                    unit_price=it.unit_price,
                    quantity=it.quantity,
                    line_total=it.line_total or 0,
                )
            )

        # Empty the cart (this commits the whole transaction, order included).
        CartService(self.db).clear(user.id)
        self.db.refresh(order)
        logger.info(
            "Order %s placed (user=%s, mode=%s, total=%s, payment_status=%s)",
            order.reference,
            user.id,
            order.mode,
            order.total,
            order.payment_status,
        )
        emails.send_order_placed(order, user)
        return order

    # --- customer reads ------------------------------------------------------

    def list_orders(self, user_id: uuid.UUID) -> list[Order]:
        return list(
            self.db.scalars(
                select(Order)
                .where(Order.user_id == user_id)
                .order_by(Order.created_at.desc())
            ).all()
        )

    def get_order(self, user_id: uuid.UUID, order_id: uuid.UUID) -> Order:
        order = self.db.get(Order, order_id)
        if order is None or order.user_id != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found.")
        return order

    def has_purchased(self, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        """True if the user has a non-declined/cancelled order with the product."""
        return (
            self.db.scalar(
                select(OrderItem.id)
                .join(Order, Order.id == OrderItem.order_id)
                .where(Order.user_id == user_id)
                .where(Order.status.in_(PURCHASED_STATUSES))
                .where(OrderItem.product_id == product_id)
                .limit(1)
            )
            is not None
        )

    # --- admin ---------------------------------------------------------------

    def _get_any_order(self, order_id: uuid.UUID) -> Order:
        order = self.db.get(Order, order_id)
        if order is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found.")
        return order

    def list_all_orders(self, status_filter: str | None = None) -> list[Order]:
        q = select(Order).order_by(Order.created_at.desc())
        if status_filter:
            q = q.where(Order.status == status_filter)
        return list(self.db.scalars(q).all())

    def get_admin_order(self, order_id: uuid.UUID) -> Order:
        return self._get_any_order(order_id)

    def approve_order(self, order_id: uuid.UUID, data: schemas.ApproveOrderRequest) -> Order:
        order = self._get_any_order(order_id)
        if order.status != "pending_approval":
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Only pending orders can be approved (this one is {order.status}).",
            )
        order.status = "approved"
        if data.expected_delivery_date is not None:
            order.expected_delivery_date = data.expected_delivery_date
        self.db.commit()
        self.db.refresh(order)
        logger.info(
            "Order %s approved (eta=%s)", order.reference, order.expected_delivery_date
        )
        emails.send_order_approved(order, order.user)
        return order

    def decline_order(self, order_id: uuid.UUID, data: schemas.DeclineOrderRequest) -> Order:
        order = self._get_any_order(order_id)
        if order.status in ("declined", "cancelled", "delivered"):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"This order is already {order.status}.",
            )
        order.status = "declined"
        order.decline_reason = data.reason

        # Free the coupon redemption back up so the code isn't burned on a
        # declined order.
        if order.coupon_id is not None:
            CouponService(self.db).release_usage(order.coupon_id)

        # Refund any captured payment. Best-effort: if Razorpay is unreachable we
        # still mark the order declined + refund_initiated so the customer is
        # informed; the refund can be retried from the Razorpay dashboard.
        if order.payment_status == "paid" and order.razorpay_payment_id:
            if razorpay_enabled():
                try:
                    refund = RazorpayService().refund_payment(order.razorpay_payment_id)
                    order.razorpay_refund_id = refund.get("id")
                    logger.info(
                        "Refund initiated for order %s (refund_id=%s)",
                        order.reference,
                        order.razorpay_refund_id,
                    )
                except HTTPException:
                    logger.exception(
                        "Refund request failed for order %s; marking refund_initiated",
                        order.reference,
                    )
            else:
                logger.warning(
                    "Razorpay disabled; refund for order %s must be issued manually",
                    order.reference,
                )
            order.payment_status = "refund_initiated"

        self.db.commit()
        self.db.refresh(order)
        logger.info(
            "Order %s declined (payment_status=%s)",
            order.reference,
            order.payment_status,
        )
        emails.send_order_declined(order, order.user)
        return order

    def update_status(
        self, order_id: uuid.UUID, data: schemas.UpdateOrderStatusRequest
    ) -> Order:
        allowed = {"approved", "shipped", "delivered", "cancelled"}
        if data.status not in allowed:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Status must be one of {', '.join(sorted(allowed))}.",
            )
        order = self._get_any_order(order_id)
        # Cancelling frees the coupon redemption (once, only on the transition).
        if (
            data.status == "cancelled"
            and order.status != "cancelled"
            and order.coupon_id is not None
        ):
            CouponService(self.db).release_usage(order.coupon_id)
        order.status = data.status
        if data.expected_delivery_date is not None:
            order.expected_delivery_date = data.expected_delivery_date
        self.db.commit()
        self.db.refresh(order)
        logger.info("Order %s status -> %s", order.reference, order.status)
        if data.status in ("shipped", "delivered", "cancelled"):
            emails.send_order_status_update(order, order.user)
        return order

    def set_expected_delivery(
        self, order_id: uuid.UUID, data: schemas.SetExpectedDeliveryRequest
    ) -> Order:
        order = self._get_any_order(order_id)
        order.expected_delivery_date = data.expected_delivery_date
        self.db.commit()
        self.db.refresh(order)
        return order

    @staticmethod
    def to_admin_response(order: Order) -> schemas.AdminOrderResponse:
        resp = schemas.AdminOrderResponse.model_validate(order, from_attributes=True)
        if order.user is not None:
            resp.customer_name = order.user.full_name
            resp.customer_email = order.user.email
        return resp
