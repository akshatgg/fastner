from pydantic import BaseModel, Field


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
