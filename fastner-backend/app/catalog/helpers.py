"""Small pure helpers for the catalog feature."""

import logging
import re

logger = logging.getLogger(__name__)

_slug_strip = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    """Turn a display name into a URL-safe slug.

    "Mild Steel (High Tensile 10.9)" -> "mild-steel-high-tensile-10-9"
    """
    value = _slug_strip.sub("-", value.strip().lower())
    return value.strip("-") or "item"
