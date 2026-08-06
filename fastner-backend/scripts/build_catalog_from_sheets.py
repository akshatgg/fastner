"""Build the whole catalog data set from the client's Google Sheets.

One script, two outputs — both written in the exact order the sheets list them,
because the sheets are the source of truth for ordering as well as content:

1. **Category page** ← the taxonomy sheet (`Sl No, Category A, B, C, D`).
   Columns are forward-filled: a blank cell means "same as the row above". Every
   node keeps its sheet row order, and the seed turns that list order into
   `Category.position`, which is what the storefront sorts by.
   → ``app/catalog/data/catalog_taxonomy.json``

2. **Product details** ← the product-detailing sheet, laid out transposed with
   one `Field,Value` block per product:

       Product Name             Hex Head Screw Fully Threaded M3x0.5x6 MS 4.6 …
       Part Number              IBCHHS0305006MS4.6SL
       Key Features             1. Fully Threaded Design – …
       Technical Specification  IBC Part Number - IBCHHS0305006MS4.6SL
                                Thread Size - M3 (3 mm)
                                …
       Application              Built to Perform Across Industries …
       Shipping Information     Shipping Destinations: Nationwide
       Link                     https://…

   Spec rows are emitted in sheet order (IBC Part Number → Thread Size →
   Length (L) → … → Weight per 100 Units), values kept verbatim.
   → ``app/catalog/data/products/hex_series.json``

Run it (defaults to the published sheets; pass paths/URLs to override):

    poetry run python scripts/build_catalog_from_sheets.py
    poetry run python scripts/build_catalog_from_sheets.py taxonomy.csv products.csv

Then seed:

    poetry run python -m app.catalog.seed
"""

import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "app" / "catalog" / "data"
TAXONOMY_OUT = DATA / "catalog_taxonomy.json"
PRODUCTS_OUT = DATA / "products" / "hex_series.json"

_SHEET = "https://docs.google.com/spreadsheets/d/{id}/export?format=csv&gid=0"
TAXONOMY_SRC = _SHEET.format(id="166FBsw9LvUz-fSCIt_QcrkrCVgpzAb58Dj_Yq5FXZ-w")
PRODUCTS_SRC = _SHEET.format(id="1f3nJOWiGiIAq9VLbgkIaVYgSuPtywLKN88QlTfodj4A")

# Taxonomy sheet: column 0 is "Sl No", then one column per level (A → D).
LEVEL_COLUMNS = (1, 2, 3, 4)

# Every row in the product sheet is the same family, so its leaf category is
# fixed. Must match a path in the taxonomy sheet above.
CATEGORY_PATH = ["Bolts & Screws", "Hexagonal Head", "MS Hexagonal Bolt"]

SPEC_FIELD = "Technical Specification"


def read_rows(source: str) -> list[list[str]]:
    """Read a sheet from a local CSV path or a published CSV URL.

    Parsed through a StringIO rather than `splitlines()`: the Key Features,
    Technical Specification, Application and Shipping cells are all multi-line,
    and splitting the text first would tear those quoted fields apart.
    """
    if source.startswith(("http://", "https://")):
        with urllib.request.urlopen(source, timeout=60) as resp:
            text = resp.read().decode("utf-8")
    else:
        text = Path(source).read_text(encoding="utf-8")
    return list(csv.reader(io.StringIO(text, newline="")))


# --------------------------------------------------------------------------- #
# 1. Category page — taxonomy
# --------------------------------------------------------------------------- #


def clean_name(cell: str) -> str:
    """Normalise a taxonomy cell, or return "" if it isn't a real node.

    The sheet writes `-` in the next column to mean "this level has nothing
    under it". Taken literally that would create 67 categories actually named
    "-"; treating it as empty is what makes the row above it a leaf (and so a
    product), which is the intent. Some cells also wrap mid-name
    ("Internal Threaded\\nDowel"), so internal whitespace is collapsed.
    """
    name = " ".join(cell.split())
    if not any(ch.isalnum() for ch in name):
        return ""
    return name


def build_taxonomy(source: str) -> list[dict]:
    """Forward-fill the A/B/C/D columns into a nested, sheet-ordered tree."""
    rows = read_rows(source)
    roots: list[dict] = []
    # One "children list" cursor per level; index 0 is the top level.
    cursors: list[list[dict] | None] = [roots, None, None, None]
    path: list[str | None] = [None] * len(LEVEL_COLUMNS)

    for row in rows[1:]:  # skip the header
        if not any(c.strip() for c in row):
            continue

        for level, col in enumerate(LEVEL_COLUMNS):
            name = clean_name(row[col] if len(row) > col else "")
            if not name:
                continue
            path[level] = name
            # A value at this level starts a new branch — anything deeper that
            # was carried over from previous rows no longer applies.
            for deeper in range(level + 1, len(path)):
                path[deeper] = None

            siblings = cursors[level]
            if siblings is None:
                continue  # deeper cell with no parent set yet — skip defensively
            node = next((n for n in siblings if n["name"] == name), None)
            if node is None:
                node = {"name": name, "children": []}
                siblings.append(node)
            if level + 1 < len(cursors):
                cursors[level + 1] = node["children"]

    return roots


# --------------------------------------------------------------------------- #
# 2. Product details
# --------------------------------------------------------------------------- #


def split_blocks(rows: list[list[str]]) -> list[dict[str, str]]:
    """Split the transposed sheet into one `{field: value}` dict per product."""
    starts = [i for i, r in enumerate(rows) if r and r[0].strip() == "Product Name"]
    blocks = []
    for n, start in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(rows)
        block: dict[str, str] = {}
        for j in range(start, end):
            row = rows[j]
            if row and row[0].strip():
                block[row[0].strip()] = row[1] if len(row) > 1 else ""
        blocks.append(block)
    return blocks


def parse_key_features(raw: str) -> list[str]:
    """`1. Foo – bar` per line → `["Foo – bar", …]`, order preserved.

    The leading number is dropped because the product page renders these as a
    checked list; keeping it would double up on the bullet.
    """
    out = []
    for line in raw.splitlines():
        line = line.strip()
        if line:
            out.append(re.sub(r"^\d+[.)]\s*", "", line))
    return out


def parse_specs(raw: str) -> dict[str, str]:
    """`Key - Value` per line → a dict in the sheet's own order.

    Values keep their spacing and tolerances verbatim. Some rows carry a stray
    trailing hyphen on the label (`Weight per 100 Units -`), so labels are
    cleaned; values are not touched.
    """
    specs: dict[str, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line or " - " not in line:
            continue
        key, value = line.split(" - ", 1)
        key = key.strip().rstrip("-").strip()
        if key:
            specs[key] = value.strip()
    return specs


def parse_shipping(raw: str) -> dict[str, str]:
    """`Label: Value` per line → its own spec rows, so each reads as a row
    rather than one cell with a line break in it."""
    out: dict[str, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        if line and ":" in line:
            label, value = line.split(":", 1)
            out[label.strip()] = value.strip()
    return out


def build_products(source: str) -> list[dict]:
    products = []
    for b in split_blocks(read_rows(source)):
        sku = b.get("Part Number", "").strip()
        name = b.get("Product Name", "").strip()
        if not sku or not name:
            continue

        # Sheet order in, sheet order out — dicts preserve insertion order and
        # `json.dump` writes them in that order.
        specs: dict[str, object] = parse_specs(b.get(SPEC_FIELD, ""))

        features = parse_key_features(b.get("Key Features", ""))
        if features:
            # Held at the end: the product page lifts this out of the table and
            # renders it as its own checked list above the specs.
            specs["Key Features"] = features

        specs.update(parse_shipping(b.get("Shipping Information", "")))

        products.append(
            {
                "sku": sku,
                "name": name,
                "category_path": CATEGORY_PATH,
                "description": b.get("Application", "").strip(),
                "specifications": specs,
                "source_link": b.get("Link", "").strip() or None,
            }
        )
    return products


def write(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def count_nodes(nodes: list[dict]) -> int:
    return sum(1 + count_nodes(n["children"]) for n in nodes)


def main() -> None:
    taxonomy_src = sys.argv[1] if len(sys.argv) > 1 else TAXONOMY_SRC
    products_src = sys.argv[2] if len(sys.argv) > 2 else PRODUCTS_SRC

    taxonomy = build_taxonomy(taxonomy_src)
    write(TAXONOMY_OUT, taxonomy)
    print(
        f"Categories → {TAXONOMY_OUT.name}: "
        f"{len(taxonomy)} top-level, {count_nodes(taxonomy)} total (sheet order)"
    )

    products = build_products(products_src)
    write(PRODUCTS_OUT, products)
    print(f"Products   → {PRODUCTS_OUT.name}: {len(products)} products")
    if products:
        print("Spec order (from the sheet):")
        for i, key in enumerate(products[0]["specifications"], 1):
            print(f"  {i:2d}. {key}")


if __name__ == "__main__":
    main()
