"""Seed the catalog from the IBC master taxonomy — and its detailed products.

Two layers of source data, both shipped under ``data/``:

1. ``data/catalog_taxonomy.json`` — an ordered, nested mirror of the "Industrial
   Supply" sheet (Category A → B → C → D). The sheet mixes categories and
   products in the same columns; the rule that separates them (per the client):

   * A node that has something nested under it is a **category** — a browse node.
   * A **leaf** node (nothing nested under it) is a **product** sitting inside
     its parent category. Top-level (A) nodes are always categories.

2. ``data/products/*.json`` — the detailed, per-size products for a given
   product type, extracted from the client's product-detailing sheets (e.g.
   ``hex_series.json``). Each size/finish/material variant is its **own product**
   (Accu-style), carrying a full ``specifications`` block and a ``category_path``
   naming the leaf category it lives under.

The two layers meet at the leaf: a taxonomy leaf that a detailed product points
at (via ``category_path``) is **promoted from a placeholder product into a real
category**, and the detailed size variants become the products inside it. So
"MS Hexagonal Bolt" — a leaf in the taxonomy — becomes a category holding its
56 M3 hex-bolt sizes. Leaves that no detail sheet references yet stay as the
single placeholder product they are today (extend by dropping in more files).

Run it (Postgres must be up — ``./dev_start.sh``):

    poetry run python -m app.catalog.seed

The script is **idempotent**. A category is matched by ``(parent_id, name)``, a
placeholder product by ``name`` + its primary category, and a detailed product
by its unique ``sku`` — so re-running only refreshes fields, never duplicates.
Nothing is ever deleted. Products are created without pricing/images (nullable);
fill those in from the admin.
"""

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.catalog.helpers import slugify
from app.catalog.models import Category, Product, ProductCategory
from app.core.database import SessionLocal

# Register every model with the mapper registry before we touch the session.
# Catalog models carry cross-module relationships (e.g. ProductIndustry →
# Industry), and SQLAlchemy configures *all* mappers on first flush — so every
# referenced class must be imported, exactly as alembic/env.py does.
import app.auth.models  # noqa: E402,F401
import app.address.models  # noqa: E402,F401
import app.cart.models  # noqa: E402,F401
import app.coupons.models  # noqa: E402,F401
import app.industries.models  # noqa: E402,F401
import app.orders.models  # noqa: E402,F401
import app.reviews.models  # noqa: E402,F401
import app.settings.models  # noqa: E402,F401
import app.support.models  # noqa: E402,F401

# ``app/catalog/data/catalog_taxonomy.json`` — shipped alongside this module.
TAXONOMY_PATH = Path(__file__).parent / "data" / "catalog_taxonomy.json"
# ``app/catalog/data/products/*.json`` — one detailed-product file per type.
PRODUCTS_DIR = Path(__file__).parent / "data" / "products"


def _upsert_category(
    db: Session, *, parent: Category | None, name: str, position: int
) -> tuple[Category, bool]:
    """Fetch-or-create one category under ``parent``.

    Matches an existing sibling by name (idempotent re-runs); otherwise inserts
    a new row, materializing ``slug``/``path``/``depth`` the same way the service
    layer does. Returns ``(category, created)``.
    """
    parent_id = parent.id if parent else None
    parent_path = parent.path if parent else ""

    existing = db.scalar(
        select(Category).where(
            Category.parent_id == parent_id, Category.name == name
        )
    )
    if existing is not None:
        existing.position = position  # keep sheet ordering in sync
        return existing, False

    # Slug unique among siblings (append -2, -3… on collision), mirroring
    # CatalogService._unique_category_slug.
    base = slugify(name)
    slug, n = base, 1
    while db.scalar(
        select(Category.id).where(
            Category.parent_id == parent_id, Category.slug == slug
        )
    ):
        n += 1
        slug = f"{base}-{n}"

    path = f"{parent_path}/{slug}" if parent_path else slug
    cat = Category(
        parent_id=parent_id,
        name=name,
        slug=slug,
        path=path,
        depth=path.count("/"),
        position=position,
        is_active=True,
    )
    db.add(cat)
    db.flush()  # assign id so children / product links can reference it
    return cat, True


def _upsert_product(
    db: Session, *, category: Category, name: str, position: int
) -> tuple[Product, bool]:
    """Fetch-or-create a leaf product living under ``category``.

    Identity is the product name + its primary category, so re-runs don't
    duplicate. The product slug (globally unique) is derived from the category
    path so same-named products under different categories stay distinct.
    """
    existing = db.scalar(
        select(Product)
        .join(ProductCategory, ProductCategory.product_id == Product.id)
        .where(
            Product.name == name,
            ProductCategory.category_id == category.id,
            ProductCategory.is_primary.is_(True),
        )
    )
    if existing is not None:
        return existing, False

    # Prefix the category slug for readability + near-global uniqueness, then
    # settle any remaining global slug collision with a numeric suffix.
    base = slugify(f"{category.slug}-{name}")
    slug, n = base, 1
    while db.scalar(select(Product.id).where(Product.slug == slug)):
        n += 1
        slug = f"{base}-{n}"

    product = Product(name=name, slug=slug, is_active=True)
    db.add(product)
    db.flush()  # assign id for the category link
    db.add(
        ProductCategory(
            product_id=product.id,
            category_id=category.id,
            is_primary=True,
            position=position,
        )
    )
    return product, True


def _walk(
    db: Session,
    nodes: list[dict],
    parent: Category | None,
    depth: int,
    stats: dict[str, int],
    forced_categories: set[tuple[str, ...]],
    prefix: tuple[str, ...] = (),
) -> None:
    """Depth-first: branch nodes (and all top-level nodes) become categories;
    leaf nodes become placeholder products under their parent category.

    A leaf is instead treated as a **category** when its full name-path is in
    ``forced_categories`` — i.e. a detailed-product file files products under it,
    so it needs to hold them rather than be a product itself.
    """
    for position, node in enumerate(nodes):
        name = node["name"]
        name_path = prefix + (name,)
        children = node.get("children", [])
        is_category = depth == 0 or bool(children) or name_path in forced_categories

        if is_category:
            cat, created = _upsert_category(
                db, parent=parent, name=name, position=position
            )
            stats["cat_created" if created else "cat_existing"] += 1
            _walk(db, children, cat, depth + 1, stats, forced_categories, name_path)
        else:
            # Leaf → placeholder product. ``parent`` is guaranteed non-None here
            # because depth-0 nodes always take the category branch above.
            assert parent is not None
            _, created = _upsert_product(
                db, category=parent, name=name, position=position
            )
            stats["prod_created" if created else "prod_existing"] += 1


def _load_product_files() -> list[dict]:
    """Load every ``data/products/*.json`` file, flattened into one ordered list.

    Each record carries its own ``category_path`` (category names from a
    top-level department down to the leaf it belongs in) plus the product fields.
    Files are read in sorted filename order for deterministic seeding.
    """
    if not PRODUCTS_DIR.is_dir():
        return []
    records: list[dict] = []
    for path in sorted(PRODUCTS_DIR.glob("*.json")):
        records.extend(json.loads(path.read_text(encoding="utf-8")))
    return records


def _forced_category_paths(records: list[dict]) -> set[tuple[str, ...]]:
    """Every category name-path (and all its ancestors) a detailed product files
    into. These taxonomy nodes must be categories, even where they are leaves in
    ``catalog_taxonomy.json`` (so they can hold their size variants)."""
    forced: set[tuple[str, ...]] = set()
    for rec in records:
        path = tuple(rec["category_path"])
        for i in range(1, len(path) + 1):
            forced.add(path[:i])
    return forced


def _resolve_category(db: Session, name_path: tuple[str, ...]) -> Category | None:
    """Walk ``name_path`` from the root, matching each level by ``(parent_id,
    name)``. Returns the leaf category, or ``None`` if any level is missing."""
    parent_id = None
    cat: Category | None = None
    for name in name_path:
        cond = (
            Category.parent_id.is_(None)
            if parent_id is None
            else Category.parent_id == parent_id
        )
        cat = db.scalar(select(Category).where(cond, Category.name == name))
        if cat is None:
            return None
        parent_id = cat.id
    return cat


def _unique_product_slug(db: Session, base: str) -> str:
    """A globally-unique product slug: ``base`` with ``-2``/``-3``… on collision."""
    slug, n = base, 1
    while db.scalar(select(Product.id).where(Product.slug == slug)):
        n += 1
        slug = f"{base}-{n}"
    return slug


def _ensure_primary_link(
    db: Session, product: Product, category: Category, position: int
) -> None:
    """Make sure ``product`` has a primary link to ``category`` (idempotent)."""
    link = db.scalar(
        select(ProductCategory).where(
            ProductCategory.product_id == product.id,
            ProductCategory.category_id == category.id,
        )
    )
    if link is None:
        db.add(
            ProductCategory(
                product_id=product.id,
                category_id=category.id,
                is_primary=True,
                position=position,
            )
        )
    else:
        link.is_primary = True
        link.position = position


def _upsert_detailed_product(
    db: Session, *, category: Category, record: dict, position: int
) -> tuple[Product, bool]:
    """Fetch-or-create a detailed product, keyed by its unique ``sku``.

    On a re-run the product's mutable fields (name, descriptions, specs) are
    refreshed and its primary category link left intact — nothing duplicates.
    Pricing/images are left untouched (nullable; set from the admin).
    """
    sku = record["sku"]
    specs = record.get("specifications", {})
    existing = db.scalar(select(Product).where(Product.sku == sku))
    if existing is not None:
        existing.name = record["name"]
        existing.short_description = record.get("short_description")
        existing.description = record.get("description")
        existing.specifications = specs
        _ensure_primary_link(db, existing, category, position)
        return existing, False

    product = Product(
        name=record["name"],
        slug=_unique_product_slug(db, slugify(sku)),
        sku=sku,
        short_description=record.get("short_description"),
        description=record.get("description"),
        specifications=specs,
        is_active=True,
    )
    db.add(product)
    db.flush()  # assign id for the category link
    db.add(
        ProductCategory(
            product_id=product.id,
            category_id=category.id,
            is_primary=True,
            position=position,
        )
    )
    return product, True


def _promote_forced_leaves(
    db: Session, records: list[dict], stats: dict[str, int]
) -> None:
    """Remove the stale placeholder product a promoted leaf used to be.

    Before detailed products existed, a leaf like "MS Hexagonal Bolt" was seeded
    as a *product* under its parent ("Hexagonal Head"). Now that a detail file
    files size variants under it, ``_walk`` has (re)created it as a *category*.
    This deletes the old placeholder product — matched by name + its primary link
    to the leaf's parent category — so the leaf isn't both a product and a
    category. On a fresh DB there is nothing to remove; on a re-run it's already
    gone. Scoped strictly to the leaves a detail file targets.
    """
    for name_path in {tuple(r["category_path"]) for r in records}:
        parent = _resolve_category(db, name_path[:-1])
        if parent is None:
            continue
        stale = db.scalar(
            select(Product)
            .join(ProductCategory, ProductCategory.product_id == Product.id)
            .where(
                Product.name == name_path[-1],
                ProductCategory.category_id == parent.id,
                ProductCategory.is_primary.is_(True),
            )
        )
        if stale is not None:
            db.delete(stale)  # cascades its product_categories link
            db.flush()
            stats["placeholder_removed"] += 1


def _seed_products(db: Session, records: list[dict], stats: dict[str, int]) -> None:
    """Attach every detailed product to its leaf category (resolved by
    ``category_path``), numbering them per-category for stable listing order."""
    next_pos: dict = {}
    for rec in records:
        name_path = tuple(rec["category_path"])
        category = _resolve_category(db, name_path)
        if category is None:
            raise RuntimeError(
                f"Product {rec['sku']!r}: category path "
                f"'{' / '.join(name_path)}' not found in the taxonomy."
            )
        pos = next_pos.get(category.id, 0)
        next_pos[category.id] = pos + 1
        _, created = _upsert_detailed_product(
            db, category=category, record=rec, position=pos
        )
        stats["detail_created" if created else "detail_existing"] += 1


def seed_catalog() -> dict[str, int]:
    """Load the taxonomy + detailed-product files and upsert the whole catalog.
    Returns counts."""
    tree: list[dict] = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    products = _load_product_files()
    forced = _forced_category_paths(products)

    stats = {
        "cat_created": 0,
        "cat_existing": 0,
        "prod_created": 0,
        "prod_existing": 0,
        "placeholder_removed": 0,
        "detail_created": 0,
        "detail_existing": 0,
    }
    db = SessionLocal()
    try:
        _walk(db, tree, None, 0, stats, forced)
        _promote_forced_leaves(db, products, stats)
        _seed_products(db, products, stats)
        db.commit()
    finally:
        db.close()
    return stats


def main() -> None:
    print(f"Seeding catalog from {TAXONOMY_PATH.name} + {PRODUCTS_DIR.name}/ …")
    s = seed_catalog()
    print(
        "Done.\n"
        f"  Categories:           {s['cat_created']} created, "
        f"{s['cat_existing']} existed.\n"
        f"  Placeholder products: {s['prod_created']} created, "
        f"{s['prod_existing']} existed, {s['placeholder_removed']} promoted to "
        f"categories.\n"
        f"  Detailed products:    {s['detail_created']} created, "
        f"{s['detail_existing']} existed."
    )


if __name__ == "__main__":
    main()
