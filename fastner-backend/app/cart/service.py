"""Cart business logic — a per-user, server-backed cart.

The cart is implicit: it's the set of ``cart_items`` rows for a ``user_id``,
one row per product. The whole cart is priced in a single mode (B2C retail or
B2B bulk); every row carries the same ``mode``, kept in sync here. Switching
mode re-prices the cart and, for B2B, lifts each line to the product's bulk
minimum quantity.
"""

import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cart import schemas
from app.cart.models import CartItem
from app.catalog.models import Product

logger = logging.getLogger(__name__)

_DEFAULT_MODE: schemas.CartMode = "b2c"


class CartService:
    def __init__(self, db: Session):
        self.db = db

    # --- helpers -------------------------------------------------------------

    def _items(self, user_id: uuid.UUID) -> list[CartItem]:
        return list(
            self.db.scalars(
                select(CartItem)
                .where(CartItem.user_id == user_id)
                .order_by(CartItem.created_at)
            ).all()
        )

    def _get_active_product(self, product_id: uuid.UUID) -> Product:
        product = self.db.get(Product, product_id)
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found.")
        if not product.is_active:
            logger.warning("Add-to-cart blocked: product %s is inactive.", product_id)
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "This product is no longer available."
            )
        if product.is_out_of_stock:
            logger.warning(
                "Add-to-cart blocked: product %s is out of stock.", product_id
            )
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "This product is currently out of stock."
            )
        return product

    @staticmethod
    def _unit_price(product: Product, mode: str) -> float | None:
        price = product.price_b2b if mode == "b2b" else product.price_b2c
        return float(price) if price is not None else None

    def _to_item_response(
        self, item: CartItem, mode: str
    ) -> schemas.CartItemResponse:
        p = item.product
        unit = self._unit_price(p, mode)
        return schemas.CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            name=p.name,
            slug=p.slug,
            image_url=p.images[0] if p.images else None,
            short_description=p.short_description,
            sku=p.sku,
            is_active=p.is_active,
            unit_price=unit,
            line_total=unit * item.quantity if unit is not None else None,
            b2b_min_qty=p.b2b_min_qty,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def _build_cart(self, user_id: uuid.UUID) -> schemas.CartResponse:
        items = self._items(user_id)
        mode = items[0].mode if items else _DEFAULT_MODE
        responses = [self._to_item_response(i, mode) for i in items]
        subtotal = sum(r.line_total or 0 for r in responses)
        return schemas.CartResponse(
            mode=mode,
            items=responses,
            total_items=len(items),
            total_quantity=sum(i.quantity for i in items),
            subtotal=subtotal,
        )

    # --- operations ----------------------------------------------------------

    def get_cart(self, user_id: uuid.UUID) -> schemas.CartResponse:
        return self._build_cart(user_id)

    def add_item(
        self, user_id: uuid.UUID, data: schemas.AddToCartRequest
    ) -> schemas.CartResponse:
        product = self._get_active_product(data.product_id)
        items = self._items(user_id)

        # One mode for the whole cart: adding in a different mode switches (and
        # re-prices) every existing line.
        if items and items[0].mode != data.mode:
            for it in items:
                it.mode = data.mode

        existing = next(
            (i for i in items if i.product_id == data.product_id), None
        )
        new_qty = (existing.quantity if existing else 0) + data.quantity
        # B2B is sold in bulk — never below the product's minimum.
        if data.mode == "b2b":
            new_qty = max(new_qty, product.b2b_min_qty)
        new_qty = min(new_qty, 9999)

        if existing is not None:
            existing.quantity = new_qty
            existing.mode = data.mode
        else:
            self.db.add(
                CartItem(
                    user_id=user_id,
                    product_id=data.product_id,
                    quantity=new_qty,
                    mode=data.mode,
                )
            )
        self.db.commit()
        logger.info(
            "Cart item added/updated: user=%s product=%s qty=%d mode=%s",
            user_id,
            data.product_id,
            new_qty,
            data.mode,
        )
        return self._build_cart(user_id)

    def update_quantity(
        self, user_id: uuid.UUID, product_id: uuid.UUID, quantity: int
    ) -> schemas.CartResponse:
        item = self.db.scalar(
            select(CartItem).where(
                CartItem.user_id == user_id, CartItem.product_id == product_id
            )
        )
        if item is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not in cart.")
        # In B2B mode the line can't drop below the product's bulk minimum.
        if item.mode == "b2b":
            quantity = max(quantity, item.product.b2b_min_qty)
        item.quantity = quantity
        self.db.commit()
        logger.info(
            "Cart item quantity updated: user=%s product=%s qty=%d",
            user_id,
            product_id,
            quantity,
        )
        return self._build_cart(user_id)

    def set_mode(
        self, user_id: uuid.UUID, mode: schemas.CartMode
    ) -> schemas.CartResponse:
        """Switch the whole cart between B2C and B2B, re-pricing every line and
        lifting quantities to the bulk minimum when switching to B2B."""
        for item in self._items(user_id):
            item.mode = mode
            if mode == "b2b":
                item.quantity = max(item.quantity, item.product.b2b_min_qty)
        self.db.commit()
        logger.info("Cart mode switched: user=%s mode=%s", user_id, mode)
        return self._build_cart(user_id)

    def remove_item(
        self, user_id: uuid.UUID, product_id: uuid.UUID
    ) -> schemas.CartResponse:
        item = self.db.scalar(
            select(CartItem).where(
                CartItem.user_id == user_id, CartItem.product_id == product_id
            )
        )
        if item is not None:
            self.db.delete(item)
            self.db.commit()
            logger.info(
                "Cart item removed: user=%s product=%s", user_id, product_id
            )
        else:
            logger.warning(
                "Cart item remove is a no-op: user=%s product=%s not in cart.",
                user_id,
                product_id,
            )
        return self._build_cart(user_id)

    def clear(self, user_id: uuid.UUID) -> schemas.CartResponse:
        items = self._items(user_id)
        for item in items:
            self.db.delete(item)
        self.db.commit()
        logger.info("Cart cleared: user=%s items=%d", user_id, len(items))
        return self._build_cart(user_id)
