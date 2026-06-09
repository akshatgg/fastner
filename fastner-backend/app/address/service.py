"""Address-book business logic — every operation is scoped to one user.

A user may save many delivery addresses and mark one as the default. The
default is a per-user invariant: setting (or creating) a default clears the
flag on every other address owned by the same user. The first address a user
saves is forced to be the default so checkout always has something selected.
"""

import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.address import schemas
from app.address.models import Address

logger = logging.getLogger(__name__)


class AddressService:
    def __init__(self, db: Session):
        self.db = db

    # --- helpers -------------------------------------------------------------

    def _list(self, user_id: uuid.UUID) -> list[Address]:
        return list(
            self.db.scalars(
                select(Address)
                .where(Address.user_id == user_id)
                # Default first, then newest — same order the UI renders.
                .order_by(Address.is_default.desc(), Address.created_at.desc())
            ).all()
        )

    def _get_owned(self, user_id: uuid.UUID, address_id: uuid.UUID) -> Address:
        address = self.db.get(Address, address_id)
        if address is None or address.user_id != user_id:
            logger.warning(
                "Address not found for user=%s address=%s.", user_id, address_id
            )
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found.")
        return address

    def _clear_other_defaults(
        self, user_id: uuid.UUID, keep_id: uuid.UUID | None
    ) -> None:
        for other in self.db.scalars(
            select(Address).where(
                Address.user_id == user_id, Address.is_default.is_(True)
            )
        ).all():
            if other.id != keep_id:
                other.is_default = False

    # --- operations ----------------------------------------------------------

    def list_addresses(self, user_id: uuid.UUID) -> list[Address]:
        return self._list(user_id)

    def create(
        self, user_id: uuid.UUID, data: schemas.AddressCreate
    ) -> Address:
        existing = self._list(user_id)
        address = Address(user_id=user_id, **data.model_dump())
        # The very first address is always the default; otherwise honour the flag.
        if not existing:
            address.is_default = True
        if address.is_default:
            self._clear_other_defaults(user_id, keep_id=None)
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)
        logger.info(
            "Address created: user=%s address=%s city=%s pincode=%s default=%s",
            user_id,
            address.id,
            address.city,
            address.pincode,
            address.is_default,
        )
        return address

    def update(
        self, user_id: uuid.UUID, address_id: uuid.UUID, data: schemas.AddressUpdate
    ) -> Address:
        address = self._get_owned(user_id, address_id)
        for field, value in data.model_dump().items():
            setattr(address, field, value)
        if address.is_default:
            self._clear_other_defaults(user_id, keep_id=address.id)
        self.db.commit()
        self.db.refresh(address)
        logger.info(
            "Address updated: user=%s address=%s city=%s pincode=%s default=%s",
            user_id,
            address.id,
            address.city,
            address.pincode,
            address.is_default,
        )
        return address

    def set_default(self, user_id: uuid.UUID, address_id: uuid.UUID) -> Address:
        address = self._get_owned(user_id, address_id)
        self._clear_other_defaults(user_id, keep_id=address.id)
        address.is_default = True
        self.db.commit()
        self.db.refresh(address)
        logger.info(
            "Default address changed: user=%s address=%s", user_id, address.id
        )
        return address

    def delete(self, user_id: uuid.UUID, address_id: uuid.UUID) -> None:
        address = self._get_owned(user_id, address_id)
        was_default = address.is_default
        self.db.delete(address)
        self.db.flush()
        # If we removed the default, promote the most recent remaining address so
        # the user always has a default to fall back on at checkout.
        if was_default:
            fallback = self.db.scalar(
                select(Address)
                .where(Address.user_id == user_id)
                .order_by(Address.created_at.desc())
            )
            if fallback is not None:
                fallback.is_default = True
                logger.info(
                    "Default address promoted after delete: user=%s address=%s",
                    user_id,
                    fallback.id,
                )
        self.db.commit()
        logger.info(
            "Address deleted: user=%s address=%s was_default=%s",
            user_id,
            address_id,
            was_default,
        )
