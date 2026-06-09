"""Industries business logic — a flat, admin-managed list of marketing sectors."""

# Annotations are deferred (PEP 563) so that the ``list[...]`` annotation on
# ``reorder`` isn't evaluated at class-body time — where ``list`` would resolve
# to this class's own ``list()`` method instead of the builtin.
from __future__ import annotations

import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.catalog.helpers import slugify
from app.industries.models import Industry
from app.industries import schemas

logger = logging.getLogger(__name__)


class IndustryService:
    def __init__(self, db: Session):
        self.db = db

    def _get(self, industry_id: uuid.UUID) -> Industry:
        industry = self.db.get(Industry, industry_id)
        if industry is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Industry not found.")
        return industry

    def _unique_slug(self, base: str, exclude_id: uuid.UUID | None = None) -> str:
        """Return a slug unique across industries, appending -2, -3… on collision."""
        slug, n = base, 1
        while True:
            q = select(Industry.id).where(Industry.slug == slug)
            if exclude_id is not None:
                q = q.where(Industry.id != exclude_id)
            if self.db.scalar(q) is None:
                return slug
            n += 1
            slug = f"{base}-{n}"

    def list(self, active_only: bool = False) -> list[Industry]:
        q = select(Industry).order_by(Industry.position, Industry.name)
        if active_only:
            q = q.where(Industry.is_active.is_(True))
        return list(self.db.scalars(q).all())

    def get(self, industry_id: uuid.UUID) -> Industry:
        return self._get(industry_id)

    def create(self, data: schemas.IndustryCreate) -> Industry:
        slug = self._unique_slug(slugify(data.slug or data.name))
        industry = Industry(
            name=data.name,
            slug=slug,
            blurb=data.blurb,
            image_url=data.image_url,
            position=data.position,
            is_active=data.is_active,
        )
        self.db.add(industry)
        self.db.commit()
        self.db.refresh(industry)
        logger.info("Industry created id=%s slug=%s", industry.id, industry.slug)
        return industry

    def update(
        self, industry_id: uuid.UUID, data: schemas.IndustryUpdate
    ) -> Industry:
        industry = self._get(industry_id)
        fields = data.model_dump(exclude_unset=True)

        if fields.get("slug"):
            industry.slug = self._unique_slug(
                slugify(fields["slug"]), exclude_id=industry.id
            )
        for key in ("name", "blurb", "image_url", "position", "is_active"):
            if key in fields and fields[key] is not None:
                setattr(industry, key, fields[key])

        self.db.commit()
        self.db.refresh(industry)
        logger.info("Industry updated id=%s slug=%s", industry.id, industry.slug)
        return industry

    def delete(self, industry_id: uuid.UUID) -> None:
        industry = self._get(industry_id)
        self.db.delete(industry)
        self.db.commit()
        logger.info("Industry deleted id=%s", industry_id)

    def reorder(self, industry_ids: list[uuid.UUID]) -> None:
        """Assign ``position`` = list index for each industry, in the given order."""
        for pos, iid in enumerate(industry_ids):
            industry = self.db.get(Industry, iid)
            if industry is not None:
                industry.position = pos
        self.db.commit()
        logger.info("Industries reordered count=%d", len(industry_ids))
