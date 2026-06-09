"""Order HTTP routes.

  * ``router`` (/orders) — the signed-in customer's own orders.
  * ``admin_router`` (/admin/orders) — the order desk: review, approve/decline
    (with refund), advance fulfilment status, and set delivery dates.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.core.database import get_db
from app.orders import schemas
from app.orders.service import OrderService
from app.utils.dependencies import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

admin_router = APIRouter(
    prefix="/admin/orders",
    tags=["orders-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)


# ============================ CUSTOMER ============================


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


# ============================ ADMIN ============================


@admin_router.get("", response_model=list[schemas.AdminOrderResponse])
def admin_list_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    """All orders (newest first), optionally filtered by fulfilment status."""
    svc = OrderService(db)
    return [svc.to_admin_response(o) for o in svc.list_all_orders(status_filter)]


@admin_router.get("/{order_id}", response_model=schemas.AdminOrderResponse)
def admin_get_order(order_id: uuid.UUID, db: Session = Depends(get_db)):
    svc = OrderService(db)
    return svc.to_admin_response(svc.get_admin_order(order_id))


@admin_router.post("/{order_id}/approve", response_model=schemas.AdminOrderResponse)
def admin_approve_order(
    order_id: uuid.UUID,
    data: schemas.ApproveOrderRequest,
    db: Session = Depends(get_db),
):
    """Approve a pending order (optionally setting the expected delivery date)."""
    svc = OrderService(db)
    return svc.to_admin_response(svc.approve_order(order_id, data))


@admin_router.post("/{order_id}/decline", response_model=schemas.AdminOrderResponse)
def admin_decline_order(
    order_id: uuid.UUID,
    data: schemas.DeclineOrderRequest,
    db: Session = Depends(get_db),
):
    """Decline a pending order and refund any captured payment."""
    svc = OrderService(db)
    return svc.to_admin_response(svc.decline_order(order_id, data))


@admin_router.patch("/{order_id}/status", response_model=schemas.AdminOrderResponse)
def admin_update_status(
    order_id: uuid.UUID,
    data: schemas.UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
):
    """Advance fulfilment status (shipped / delivered / cancelled)."""
    logger.info("Admin updating order %s status -> %s", order_id, data.status)
    svc = OrderService(db)
    return svc.to_admin_response(svc.update_status(order_id, data))


@admin_router.patch("/{order_id}/delivery", response_model=schemas.AdminOrderResponse)
def admin_set_delivery(
    order_id: uuid.UUID,
    data: schemas.SetExpectedDeliveryRequest,
    db: Session = Depends(get_db),
):
    """Set or clear the expected delivery date."""
    svc = OrderService(db)
    return svc.to_admin_response(svc.set_expected_delivery(order_id, data))
