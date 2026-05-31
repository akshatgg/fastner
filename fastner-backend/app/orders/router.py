"""Order HTTP routes — all scoped to the signed-in user."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.database import get_db
from app.orders import schemas
from app.orders.service import OrderService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    data: schemas.PlaceOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Place an order from the current cart (optionally verifying payment)."""
    return OrderService(db).place_order(user, data)


@router.get("", response_model=list[schemas.OrderResponse])
def list_orders(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """The signed-in user's orders, newest first."""
    return OrderService(db).list_orders(user.id)


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).get_order(user.id, order_id)
