"""Delete the catalog that ``seed.py`` inserted — its categories and products.

Companion to :mod:`app.catalog.seed`. It removes exactly the taxonomy the sheet
defines: the top-level departments in ``data/catalog_taxonomy.json``, every
descendant category, and every product living under any of those categories.
Categories/products created outside the sheet are left alone (departments are
matched only by the sheet's own names).

Run it (Postgres must be up — ``./dev_start.sh``):

    poetry run python -m app.catalog.unseed            # delete
    poetry run python -m app.catalog.unseed --dry-run  # preview, delete nothing

Products are deleted first (each cascades away its ``product_categories`` link),
then categories are removed deepest level first so the self-referential
``parent_id`` RESTRICT foreign key is never violated.
"""

import json
import sys
from pathlib import Path

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.catalog.models import Category, Product, ProductCategory
from app.core.database import SessionLocal

# Register every model with the mapper registry before touching the session —
# same block as seed.py / alembic/env.py.
import app.auth.models  # noqa: E402,F401
import app.address.models  # noqa: E402,F401
import app.cart.models  # noqa: E402,F401
import app.coupons.models  # noqa: E402,F401
import app.industries.models  # noqa: E402,F401
import app.orders.models  # noqa: E402,F401
import app.reviews.models  # noqa: E402,F401
import app.settings.models  # noqa: E402,F401
import app.support.models  # noqa: E402,F401

TAXONOMY_PATH = Path(__file__).parent / "data" / "catalog_taxonomy.json"


def _seeded(db: Session) -> tuple[list[Category], list[Category], list]:
    """Return ``(roots, subtree_categories, product_ids)`` for the seeded data."""
    tree: list[dict] = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    root_names = [n["name"] for n in tree]

    roots = list(
        db.scalars(
            select(Category).where(
                Category.parent_id.is_(None), Category.name.in_(root_names)
            )
        )
    )
    if not roots:
        return [], [], []

    # Each subtree = the root plus anything whose path is prefixed by "<root>/".
    conds = []
    for r in roots:
        conds.append(Category.path == r.path)
        conds.append(Category.path.like(f"{r.path}/%"))
    subtree = list(db.scalars(select(Category).where(or_(*conds))))
    cat_ids = [c.id for c in subtree]

    # Products whose (primary or secondary) category link is in the subtree.
    product_ids = list(
        db.scalars(
            select(ProductCategory.product_id)
            .where(ProductCategory.category_id.in_(cat_ids))
            .distinct()
        )
    )
    return roots, subtree, product_ids


def delete_catalog(dry_run: bool = False) -> tuple[int, int]:
    """Delete the seeded categories and products. Returns ``(n_categories,
    n_products)`` removed (or that would be removed, when ``dry_run``)."""
    db = SessionLocal()
    try:
        roots, subtree, product_ids = _seeded(db)
        if not subtree:
            print("No seeded taxonomy found — nothing to delete.")
            return 0, 0

        if dry_run:
            print(
                f"[dry-run] would delete {len(subtree)} categories and "
                f"{len(product_ids)} products under {len(roots)} departments:"
            )
            for r in sorted(roots, key=lambda c: c.position):
                print(f"   - {r.name}")
            return len(subtree), len(product_ids)

        # 1) Products first — deleting a product cascades its category links.
        if product_ids:
            db.execute(delete(Product).where(Product.id.in_(product_ids)))
            db.flush()

        # 2) Categories, deepest level first, so no parent is removed while its
        #    children still exist (parent_id is ON DELETE RESTRICT).
        by_depth: dict[int, list] = {}
        for cat in subtree:
            by_depth.setdefault(cat.depth, []).append(cat.id)
        for depth in sorted(by_depth, reverse=True):
            db.execute(delete(Category).where(Category.id.in_(by_depth[depth])))
            db.flush()

        db.commit()
        print(
            f"Deleted {len(subtree)} categories and {len(product_ids)} products "
            f"under {len(roots)} departments."
        )
        return len(subtree), len(product_ids)
    finally:
        db.close()


def main() -> None:
    dry_run = "--dry-run" in sys.argv or "-n" in sys.argv
    delete_catalog(dry_run=dry_run)


if __name__ == "__main__":
    main()
