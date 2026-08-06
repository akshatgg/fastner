"""Store-settings business logic.

A tiny key/value store for admin-editable, store-wide settings. The only setting
today is the GST rate applied to every order's product subtotal. Reads fall back
to :data:`DEFAULT_GST_RATE` when the row is absent so the feature works before an
admin ever touches it.
"""

import logging
from decimal import Decimal, InvalidOperation

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.models import User
from app.catalog.models import Category, Product
from app.industries.models import Industry
from app.settings.models import HomepageStat, StoreSetting

logger = logging.getLogger(__name__)

GST_RATE_KEY = "gst_rate"
# Standard Indian GST on fasteners; admin-overridable from the dashboard.
DEFAULT_GST_RATE = Decimal("18.00")

# --- Homepage stats bar -----------------------------------------------------
#
# The canonical set of figures shown in the homepage "By the numbers" bar, in
# display order. Each entry is (key, default label); the live count for a key is
# computed by ``SettingsService._live_count``. Rows are seeded from this list on
# first read, so the bar works before an admin ever opens the dashboard. Adding a
# stat = add a tuple here and a branch in ``_live_count``.
HOMEPAGE_STAT_DEFAULTS: list[tuple[str, str]] = [
    ("industries", "Industries Served"),
    ("customers", "Happy Customers"),
    ("categories", "Product Categories"),
    ("products", "Products Stocked"),
]


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
        logger.info("Store setting updated key=%s value=%s", GST_RATE_KEY, normalised)
        return normalised

    # --- Homepage stats -----------------------------------------------------

    def _live_count(self, key: str) -> int:
        """The live figure for a stat ``key``, counted from the database.

        Unknown keys (a stat that only ever carries a manual value) count as 0 —
        the manual override still wins, so the returned live value is only a
        reference shown in the admin.
        """
        if key == "industries":
            stmt = select(func.count()).select_from(Industry).where(
                Industry.is_active.is_(True)
            )
        elif key == "customers":
            stmt = select(func.count()).select_from(User).where(User.role == "customer")
        elif key == "categories":
            stmt = select(func.count()).select_from(Category).where(
                Category.is_active.is_(True)
            )
        elif key == "products":
            stmt = select(func.count()).select_from(Product).where(
                Product.is_active.is_(True)
            )
        else:
            return 0
        return self.db.scalar(stmt) or 0

    def _ensure_homepage_stats(self) -> list[HomepageStat]:
        """Seed any missing canonical stat rows, then return every stat ordered
        for display. Idempotent — safe to call on every read."""
        existing = {
            row.key: row
            for row in self.db.scalars(select(HomepageStat)).all()
        }
        created = False
        for position, (key, label) in enumerate(HOMEPAGE_STAT_DEFAULTS):
            if key not in existing:
                self.db.add(
                    HomepageStat(key=key, label=label, position=position)
                )
                created = True
        if created:
            self.db.commit()
        return list(
            self.db.scalars(
                select(HomepageStat).order_by(
                    HomepageStat.position, HomepageStat.label
                )
            ).all()
        )

    def get_public_homepage_stats(self) -> list[dict]:
        """Resolved, display-ready stats for the storefront bar — active rows
        only, each with its live count or manual override applied."""
        return [
            {
                "key": row.key,
                "label": row.label,
                "value": row.manual_value
                if row.manual_value is not None
                else self._live_count(row.key),
                "suffix": row.suffix,
            }
            for row in self._ensure_homepage_stats()
            if row.is_active
        ]

    def get_admin_homepage_stats(self) -> list[dict]:
        """Every stat for the admin editor, each annotated with the live count so
        the dashboard can show what "reset to live" would display."""
        return [
            {
                "key": row.key,
                "label": row.label,
                "manual_value": row.manual_value,
                "live_value": self._live_count(row.key),
                "suffix": row.suffix,
                "position": row.position,
                "is_active": row.is_active,
            }
            for row in self._ensure_homepage_stats()
        ]

    def update_homepage_stats(self, updates: list) -> list[dict]:
        """Apply admin edits, matching each update to its row by ``key``. Unknown
        keys are ignored (the canonical set is fixed in code)."""
        rows = {row.key: row for row in self._ensure_homepage_stats()}
        for update in updates:
            row = rows.get(update.key)
            if row is None:
                continue
            row.label = update.label
            row.manual_value = update.manual_value
            row.suffix = update.suffix
            row.is_active = update.is_active
        self.db.commit()
        logger.info("Homepage stats updated count=%d", len(updates))
        return self.get_admin_homepage_stats()
