"""Catalog HTTP routes.

Two routers:
  * ``admin_router`` (/admin/catalog) — full CRUD, gated to admin/superadmin.
  * ``public_router`` (/catalog) — read-only storefront endpoints.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.catalog import schemas
from app.catalog.service import CatalogService
from app.core.database import get_db
from app.utils.dependencies import require_role

logger = logging.getLogger(__name__)

admin_router = APIRouter(
    prefix="/admin/catalog",
    tags=["catalog-admin"],
    dependencies=[Depends(require_role("admin", "superadmin"))],
)
public_router = APIRouter(prefix="/catalog", tags=["catalog"])


class ProductReorderRequest(BaseModel):
    """An ordered list of product ids; each id's index becomes its ``position``."""

    product_ids: list[uuid.UUID]


def _category_response(svc: CatalogService, cat) -> schemas.CategoryResponse:
    svc.annotate_is_leaf(cat)
    return schemas.CategoryResponse.model_validate(cat, from_attributes=True)


# ============================ ADMIN: categories ============================


@admin_router.post(
    "/categories", response_model=schemas.CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(data: schemas.CategoryCreate, db: Session = Depends(get_db)):
    svc = CatalogService(db)
    return _category_response(svc, svc.create_category(data))


@admin_router.get("/categories", response_model=list[schemas.CategoryTreeNode])
def list_categories_tree(db: Session = Depends(get_db)):
    return CatalogService(db).build_tree(active_only=False)


@admin_router.get("/categories/{category_id}", response_model=schemas.CategoryResponse)
def get_category(category_id: uuid.UUID, db: Session = Depends(get_db)):
    svc = CatalogService(db)
    return _category_response(svc, svc.get_category(category_id))


@admin_router.put("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: uuid.UUID, data: schemas.CategoryUpdate, db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    return _category_response(svc, svc.update_category(category_id, data))


@admin_router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: uuid.UUID, db: Session = Depends(get_db)):
    logger.info("Admin delete category id=%s", category_id)
    CatalogService(db).delete_category(category_id)


# ============================ ADMIN: filter groups/values ============================


@admin_router.post(
    "/filter-groups", response_model=schemas.FilterGroupResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_filter_group(data: schemas.FilterGroupCreate, db: Session = Depends(get_db)):
    return CatalogService(db).create_filter_group(data)


@admin_router.get("/filter-groups", response_model=list[schemas.FilterGroupWithValues])
def list_filter_groups(db: Session = Depends(get_db)):
    return CatalogService(db).list_filter_groups()


@admin_router.put("/filter-groups/{group_id}", response_model=schemas.FilterGroupResponse)
def update_filter_group(
    group_id: uuid.UUID, data: schemas.FilterGroupUpdate, db: Session = Depends(get_db)
):
    return CatalogService(db).update_filter_group(group_id, data)


@admin_router.delete("/filter-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_filter_group(group_id: uuid.UUID, db: Session = Depends(get_db)):
    CatalogService(db).delete_filter_group(group_id)


@admin_router.post(
    "/filter-values", response_model=schemas.FilterValueResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_filter_value(data: schemas.FilterValueCreate, db: Session = Depends(get_db)):
    return CatalogService(db).create_filter_value(data)


@admin_router.put("/filter-values/{value_id}", response_model=schemas.FilterValueResponse)
def update_filter_value(
    value_id: uuid.UUID, data: schemas.FilterValueUpdate, db: Session = Depends(get_db)
):
    return CatalogService(db).update_filter_value(value_id, data)


@admin_router.delete("/filter-values/{value_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_filter_value(value_id: uuid.UUID, db: Session = Depends(get_db)):
    CatalogService(db).delete_filter_value(value_id)


# ============================ ADMIN: products ============================


@admin_router.post(
    "/products", response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(data: schemas.ProductCreate, db: Session = Depends(get_db)):
    svc = CatalogService(db)
    return svc.to_product_response(svc.create_product(data))


# Declared before /products/{product_id} so "reorder" isn't parsed as an id.
@admin_router.put("/products/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_products(data: ProductReorderRequest, db: Session = Depends(get_db)):
    """Persist a new product display order (drag-and-drop in the admin tree)."""
    CatalogService(db).reorder_products(data.product_ids)


@admin_router.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    svc = CatalogService(db)
    return svc.to_product_response(svc.get_product(product_id))


@admin_router.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: uuid.UUID, data: schemas.ProductUpdate, db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    return svc.to_product_response(svc.update_product(product_id, data))


@admin_router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    logger.info("Admin delete product id=%s", product_id)
    CatalogService(db).delete_product(product_id)


@admin_router.get(
    "/categories/{category_id}/products",
    response_model=schemas.ProductListResponse,
)
def admin_category_products(
    category_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """All products under a category (including inactive) for the admin tree."""
    return CatalogService(db).list_products_in_category(
        category_id, [], page, page_size, active_only=False
    )


# ============================ PUBLIC: storefront ============================


@public_router.get("/tree", response_model=list[schemas.CategoryTreeNode])
def category_tree(
    range: str | None = Query(default=None, pattern="^(industrial|diy)$"),
    db: Session = Depends(get_db),
):
    """The active category tree for storefront navigation, optionally limited to
    a single range (``industrial`` or ``diy``)."""
    return CatalogService(db).build_tree(active_only=True, range_=range)


@public_router.get("/products", response_model=list[schemas.ProductSitemapItem])
def list_public_products(db: Session = Depends(get_db)):
    """All active product slugs + timestamps, for the storefront sitemap."""
    return CatalogService(db).list_active_products()


@public_router.get("/search", response_model=schemas.SearchResults)
def search_catalog(
    q: str = Query(default="", max_length=255),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Type-ahead storefront search over products and categories."""
    return CatalogService(db).search(q, limit)


@public_router.get("/categories/{category_id}", response_model=schemas.CategoryResponse)
def public_category(category_id: uuid.UUID, db: Session = Depends(get_db)):
    svc = CatalogService(db)
    return _category_response(svc, svc.get_category(category_id))


@public_router.get(
    "/categories/{category_id}/products", response_model=schemas.ProductListResponse
)
def category_products(
    category_id: uuid.UUID,
    filter_value_ids: list[uuid.UUID] = Query(default=[]),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    sort: str = Query(default="featured", pattern="^(featured|price_asc|price_desc)$"),
    price_mode: str = Query(default="b2c", pattern="^(b2c|b2b)$"),
    db: Session = Depends(get_db),
):
    """Products under a category (rolled up across all descendant leaves),
    with the available filter facets. Optionally filtered by ``filter_value_ids``
    and sorted by ``sort`` (price sorts use the ``price_mode`` column)."""
    return CatalogService(db).list_products_in_category(
        category_id, filter_value_ids, page, page_size,
        sort=sort, price_mode=price_mode,
    )


@public_router.get(
    "/products/{slug}/related", response_model=list[schemas.ProductSearchItem]
)
def related_products(
    slug: str,
    limit: int = Query(default=8, ge=1, le=24),
    db: Session = Depends(get_db),
):
    """Products related to ``slug`` (same-category siblings) for the
    "you may also like" section on the product page."""
    return CatalogService(db).related_products(slug, limit)


@public_router.get("/products/{slug}", response_model=schemas.ProductResponse)
def product_detail(slug: str, db: Session = Depends(get_db)):
    svc = CatalogService(db)
    return svc.to_product_response(svc.get_product_by_slug(slug))
