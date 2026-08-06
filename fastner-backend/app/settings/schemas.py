from pydantic import BaseModel, ConfigDict, Field


class GstSettingResponse(BaseModel):
    """The current GST rate (a percentage, e.g. 18.0)."""

    gst_rate: float


class GstSettingUpdate(BaseModel):
    """Admin update for the store GST rate. 0–100 inclusive (0 disables GST)."""

    gst_rate: float = Field(ge=0, le=100)


class PublicSettingsResponse(BaseModel):
    """Store settings safe to expose to the storefront (used to show the GST
    line on the cart/checkout before an order is placed)."""

    gst_rate: float


# --- Homepage stats bar -----------------------------------------------------


class HomepageStatPublic(BaseModel):
    """One resolved figure for the storefront's "By the numbers" bar. ``value``
    is the number to display — the live DB count, or the admin override when set.
    """

    key: str
    label: str
    value: int
    suffix: str


class HomepageStatAdmin(BaseModel):
    """A stat as the admin edits it. Carries both the current ``manual_value``
    (``None`` = live) and the ``live_value`` computed right now, so the dashboard
    can show what the live count would be while a manual override is in place.
    """

    model_config = ConfigDict(from_attributes=True)

    key: str
    label: str
    manual_value: int | None
    live_value: int
    suffix: str
    position: int
    is_active: bool


class HomepageStatUpdate(BaseModel):
    """Admin update for a single stat, matched to its row by ``key``. A ``None``
    ``manual_value`` resets the stat back to its live count."""

    key: str
    label: str = Field(min_length=1, max_length=128)
    manual_value: int | None = Field(default=None, ge=0)
    suffix: str = Field(default="+", max_length=8)
    is_active: bool = True


class HomepageStatsUpdateRequest(BaseModel):
    """Bulk save of the homepage stats config from the admin dashboard."""

    stats: list[HomepageStatUpdate]
