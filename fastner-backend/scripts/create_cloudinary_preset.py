"""One-off: create the unsigned Cloudinary upload preset used by the admin UI.

Reads CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET from the
backend .env (never from the command line), then creates an *unsigned* preset
named ``ibc_unsigned`` so the browser can upload images. Safe to re-run — if the
preset already exists Cloudinary returns 409 and we just report it.

Run:  poetry run python scripts/create_cloudinary_preset.py
"""

import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request

from dotenv import load_dotenv

load_dotenv()

PRESET_NAME = "ibc_unsigned"

cloud = os.getenv("CLOUDINARY_CLOUD_NAME")
key = os.getenv("CLOUDINARY_API_KEY")
secret = os.getenv("CLOUDINARY_API_SECRET")

missing = [
    name
    for name, val in [
        ("CLOUDINARY_CLOUD_NAME", cloud),
        ("CLOUDINARY_API_KEY", key),
        ("CLOUDINARY_API_SECRET", secret),
    ]
    if not val
]
if missing:
    raise SystemExit(f"Missing in .env: {', '.join(missing)}")

url = f"https://api.cloudinary.com/v1_1/{cloud}/upload_presets"
# Unsigned preset; the per-image folder (ibc/industries, etc.) is sent at upload
# time by the frontend, so we don't pin a folder here.
body = urllib.parse.urlencode({"name": PRESET_NAME, "unsigned": "true"}).encode()
auth = base64.b64encode(f"{key}:{secret}".encode()).decode()

req = urllib.request.Request(url, data=body, method="POST")
req.add_header("Authorization", f"Basic {auth}")

try:
    with urllib.request.urlopen(req) as resp:
        data = json.load(resp)
    print(f"✅ Created unsigned preset '{data.get('name', PRESET_NAME)}'.")
except urllib.error.HTTPError as exc:
    detail = exc.read().decode()
    if exc.code == 409 or "already exists" in detail.lower():
        print(f"✅ Preset '{PRESET_NAME}' already exists — nothing to do.")
    else:
        raise SystemExit(f"❌ Cloudinary error (HTTP {exc.code}): {detail}")
