"""Cart business logic — a per-user, server-backed enquiry/quote cart.

Products carry no price in this catalog, so the cart is a quantity list the
user assembles and submits as an enquiry. One row per (user, product); adding
an existing product bumps its quantity.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cart import schemas
from app.cart.models import CartItem
from app.catalog.models import Product


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
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "This product is no longer available."
            )
        return product

    def _to_item_response(self, item: CartItem) -> schemas.CartItemResponse:
        p = item.product
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
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def _build_cart(self, user_id: uuid.UUID) -> schemas.CartResponse:
        items = self._items(user_id)
        return schemas.CartResponse(
            items=[self._to_item_response(i) for i in items],
            total_items=len(items),
            total_quantity=sum(i.quantity for i in items),
        )

    # --- operations ----------------------------------------------------------

    def get_cart(self, user_id: uuid.UUID) -> schemas.CartResponse:
        return self._build_cart(user_id)

    def add_item(
        self, user_id: uuid.UUID, data: schemas.AddToCartRequest
    ) -> schemas.CartResponse:
        self._get_active_product(data.product_id)
        existing = self.db.scalar(
            select(CartItem).where(
                CartItem.user_id == user_id,
                CartItem.product_id == data.product_id,
            )
        )
        if existing is not None:
            existing.quantity = min(existing.quantity + data.quantity, 9999)
        else:
            self.db.add(
                CartItem(
                    user_id=user_id,
                    product_id=data.product_id,
                    quantity=data.quantity,
                )
            )
        self.db.commit()
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
        item.quantity = quantity
        self.db.commit()
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
        return self._build_cart(user_id)

    def clear(self, user_id: uuid.UUID) -> schemas.CartResponse:
        for item in self._items(user_id):
            self.db.delete(item)
        self.db.commit()
        return self._build_cart(user_id)
