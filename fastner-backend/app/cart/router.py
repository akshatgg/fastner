"""Cart HTTP routes — all scoped to the authenticated user's own cart."""

import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.models import User
from app.cart import schemas
from app.cart.service import CartService
from app.core.database import get_db
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=schemas.CartResponse)
def get_cart(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return CartService(db).get_cart(user.id)


@router.post("/items", response_model=schemas.CartResponse)
def add_to_cart(
    data: schemas.AddToCartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CartService(db).add_item(user.id, data)


@router.put("/mode", response_model=schemas.CartResponse)
def set_cart_mode(
    data: schemas.SetCartModeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CartService(db).set_mode(user.id, data.mode)


@router.put("/items/{product_id}", response_model=schemas.CartResponse)
def update_cart_item(
    product_id: uuid.UUID,
    data: schemas.UpdateCartItemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CartService(db).update_quantity(user.id, product_id, data.quantity)


@router.delete("/items/{product_id}", response_model=schemas.CartResponse)
def remove_cart_item(
    product_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CartService(db).remove_item(user.id, product_id)


@router.delete("", response_model=schemas.CartResponse)
def clear_cart(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    logger.info("Clear cart for user=%s", user.id)
    return CartService(db).clear(user.id)
