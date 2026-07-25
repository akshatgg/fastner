"""Seed the catalog from the IBC master taxonomy.

The source of truth is ``data/catalog_taxonomy.json`` — an ordered, nested mirror
of the "Industrial Supply" sheet the client provided (Category A → B → C → D).

The sheet mixes categories and products in the same columns. The rule that
separates them (per the client):

* A node that has something nested under it is a **category** — a browse node.
* A **leaf** node (nothing nested under it) is a **product**, and it belongs to
  its parent category. So a "Category B" with no "Category C" is a product
  sitting directly inside its "Category A" department; a "Category C" with no
  "Category D" is a product inside its "Category B"; every "Category D" is a
  product. Top-level (A) nodes are always categories.

This mirrors the backend model itself: products attach to leaf categories.

Run it (Postgres must be up — ``./dev_start.sh``):

    poetry run python -m app.catalog.seed

The script is **idempotent**. A category is matched by ``(parent_id, name)`` and
a product by ``name`` + its primary category, so re-running never duplicates.
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
) -> None:
    """Depth-first: branch nodes (and all top-level nodes) become categories;
    leaf nodes become products under their parent category."""
    for position, node in enumerate(nodes):
        children = node.get("children", [])
        is_category = depth == 0 or bool(children)

        if is_category:
            cat, created = _upsert_category(
                db, parent=parent, name=node["name"], position=position
            )
            stats["cat_created" if created else "cat_existing"] += 1
            _walk(db, children, cat, depth + 1, stats)
        else:
            # Leaf → product. ``parent`` is guaranteed non-None here because
            # depth-0 nodes always take the category branch above.
            assert parent is not None
            _, created = _upsert_product(
                db, category=parent, name=node["name"], position=position
            )
            stats["prod_created" if created else "prod_existing"] += 1


def seed_catalog() -> dict[str, int]:
    """Load the taxonomy JSON and upsert the whole catalog. Returns counts."""
    tree: list[dict] = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))

    stats = {
        "cat_created": 0,
        "cat_existing": 0,
        "prod_created": 0,
        "prod_existing": 0,
    }
    db = SessionLocal()
    try:
        _walk(db, tree, None, 0, stats)
        db.commit()
    finally:
        db.close()
    return stats


def main() -> None:
    print(f"Seeding catalog from {TAXONOMY_PATH.name} …")
    s = seed_catalog()
    print(
        "Done. "
        f"Categories: {s['cat_created']} created, {s['cat_existing']} existed. "
        f"Products: {s['prod_created']} created, {s['prod_existing']} existed."
    )


if __name__ == "__main__":
    main()
