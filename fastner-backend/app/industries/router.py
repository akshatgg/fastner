"""Industries HTTP routes.

Two routers:
  * ``admin_router`` (/admin/industries) — full CRUD, gated to admin/superadmin.
  * ``public_router`` (/industries) — read-only storefront list (active only).
"""

import uuid

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.industries import schemas
from app.industries.service import IndustryService
from app.utils.dependencies import require_role

admin_router = APIRouter(
    prefix="/admin/industries",
    tags=["industries-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)
public_router = APIRouter(prefix="/industries", tags=["industries"])


class IndustryReorderRequest(BaseModel):
    """An ordered list of industry ids; each id's index becomes its ``position``."""

    industry_ids: list[uuid.UUID]


# ============================ ADMIN ============================


@admin_router.get("", response_model=list[schemas.IndustryResponse])
def list_industries(db: Session = Depends(get_db)):
    return IndustryService(db).list(active_only=False)


@admin_router.post(
    "", response_model=schemas.IndustryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_industry(data: schemas.IndustryCreate, db: Session = Depends(get_db)):
    return IndustryService(db).create(data)


# Declared before /{industry_id} so "reorder" isn't parsed as an id.
@admin_router.put("/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_industries(data: IndustryReorderRequest, db: Session = Depends(get_db)):
    """Persist a new industry display order (drag-and-drop in the admin list)."""
    IndustryService(db).reorder(data.industry_ids)


@admin_router.get("/{industry_id}", response_model=schemas.IndustryResponse)
def get_industry(industry_id: uuid.UUID, db: Session = Depends(get_db)):
    return IndustryService(db).get(industry_id)


@admin_router.put("/{industry_id}", response_model=schemas.IndustryResponse)
def update_industry(
    industry_id: uuid.UUID, data: schemas.IndustryUpdate, db: Session = Depends(get_db)
):
    return IndustryService(db).update(industry_id, data)


@admin_router.delete("/{industry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_industry(industry_id: uuid.UUID, db: Session = Depends(get_db)):
    IndustryService(db).delete(industry_id)


# ============================ PUBLIC ============================


@public_router.get("", response_model=list[schemas.IndustryResponse])
def public_industries(db: Session = Depends(get_db)):
    """Active industries, ordered, for the storefront marketing section."""
    return IndustryService(db).list(active_only=True)
