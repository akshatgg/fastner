"""Order business logic: turn a user's cart into a persisted order.

An order is a point-in-time snapshot of the cart (items + prices), so it stays
correct even if the catalog changes later. Placing an order optionally verifies
a Razorpay payment (marking the order ``paid``); without payment details it
falls back to a plain ``placed`` order. Either way the cart is emptied.

Orders also answer "has this user bought this product?" via
:meth:`OrderService.has_purchased`, which gates verified-purchase reviews.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.address.models import Address
from app.auth.models import User
from app.cart.service import CartService
from app.orders import schemas
from app.orders.models import PURCHASED_STATUSES, Order, OrderItem
from app.payments.service import RazorpayService


class OrderService:
    def __init__(self, db: Session):
        self.db = db

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
        order_status = "placed"
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
            order_status = "paid"
            rzp_order_id = data.razorpay_order_id
            rzp_payment_id = data.razorpay_payment_id

        order = Order(
            reference="",  # set from the id once it's assigned
            user_id=user.id,
            address_id=data.address_id,
            status=order_status,
            mode=cart.mode,
            subtotal=cart.subtotal,
            razorpay_order_id=rzp_order_id,
            razorpay_payment_id=rzp_payment_id,
        )
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
        return order

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

    def has_purchased(
        self, user_id: uuid.UUID, product_id: uuid.UUID
    ) -> bool:
        """True if the user has a non-cancelled order containing the product."""
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
