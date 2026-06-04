"""Store-settings HTTP routes.

  * ``admin_router`` (/admin/settings) — read + update, gated to admin.
  * ``public_router`` (/settings) — read-only values the storefront may show
    (the GST rate, so the cart/checkout can display the tax line).
"""

from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.settings import schemas
from app.settings.service import SettingsService
from app.utils.dependencies import require_role

admin_router = APIRouter(
    prefix="/admin/settings",
    tags=["settings-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)
public_router = APIRouter(prefix="/settings", tags=["settings"])


@admin_router.get("/gst", response_model=schemas.GstSettingResponse)
def get_gst(db: Session = Depends(get_db)):
    return schemas.GstSettingResponse(gst_rate=float(SettingsService(db).get_gst_rate()))


@admin_router.put("/gst", response_model=schemas.GstSettingResponse)
def update_gst(data: schemas.GstSettingUpdate, db: Session = Depends(get_db)):
    rate = SettingsService(db).set_gst_rate(Decimal(str(data.gst_rate)))
    return schemas.GstSettingResponse(gst_rate=float(rate))


@public_router.get("/public", response_model=schemas.PublicSettingsResponse)
def public_settings(db: Session = Depends(get_db)):
    return schemas.PublicSettingsResponse(
        gst_rate=float(SettingsService(db).get_gst_rate())
    )
