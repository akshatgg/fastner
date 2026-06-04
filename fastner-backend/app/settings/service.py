"""Store-settings business logic.

A tiny key/value store for admin-editable, store-wide settings. The only setting
today is the GST rate applied to every order's product subtotal. Reads fall back
to :data:`DEFAULT_GST_RATE` when the row is absent so the feature works before an
admin ever touches it.
"""

from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.settings.models import StoreSetting

GST_RATE_KEY = "gst_rate"
# Standard Indian GST on fasteners; admin-overridable from the dashboard.
DEFAULT_GST_RATE = Decimal("18.00")


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def _get(self, key: str) -> str | None:
        return self.db.scalar(
            select(StoreSetting.value).where(StoreSetting.key == key)
        )

    def _set(self, key: str, value: str) -> None:
        row = self.db.scalar(select(StoreSetting).where(StoreSetting.key == key))
        if row is None:
            self.db.add(StoreSetting(key=key, value=value))
        else:
            row.value = value
        self.db.commit()

    # --- GST ----------------------------------------------------------------

    def get_gst_rate(self) -> Decimal:
        """The GST percentage applied to order subtotals (e.g. ``Decimal('18.00')``)."""
        raw = self._get(GST_RATE_KEY)
        if raw is None:
            return DEFAULT_GST_RATE
        try:
            return Decimal(raw)
        except (InvalidOperation, ValueError):
            return DEFAULT_GST_RATE

    def set_gst_rate(self, rate: Decimal) -> Decimal:
        # Normalise to 2 decimal places for a clean, predictable stored value.
        normalised = Decimal(rate).quantize(Decimal("0.01"))
        self._set(GST_RATE_KEY, str(normalised))
        return normalised
