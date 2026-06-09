"""Address-book HTTP routes — all scoped to the authenticated user."""

import logging
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.address import schemas
from app.address.service import AddressService
from app.auth.models import User
from app.core.database import get_db
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=list[schemas.AddressResponse])
def list_addresses(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return AddressService(db).list_addresses(user.id)


@router.post(
    "", response_model=schemas.AddressResponse, status_code=status.HTTP_201_CREATED
)
def create_address(
    data: schemas.AddressCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).create(user.id, data)


@router.put("/{address_id}", response_model=schemas.AddressResponse)
def update_address(
    address_id: uuid.UUID,
    data: schemas.AddressUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).update(user.id, address_id, data)


@router.put("/{address_id}/default", response_model=schemas.AddressResponse)
def set_default_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).set_default(user.id, address_id)


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info("Delete address id=%s for user=%s", address_id, user.id)
    AddressService(db).delete(user.id, address_id)
