import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# --- categories --------------------------------------------------------------


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    # Optional: auto-derived from name when omitted.
    slug: str | None = Field(default=None, max_length=255)
    parent_id: uuid.UUID | None = None
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=1024)
    position: int = 0
    is_active: bool = True


class CategoryUpdate(BaseModel):
    """All fields optional — only those provided are changed. Setting
    ``parent_id`` moves the category (and its whole subtree)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    parent_id: uuid.UUID | None = None
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=1024)
    position: int | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    parent_id: uuid.UUID | None
    name: str
    slug: str
    path: str
    depth: int
    position: int
    description: str | None
    image_url: str | None
    is_active: bool
    is_leaf: bool = True
    created_at: datetime
    updated_at: datetime


class CategoryTreeNode(CategoryResponse):
    children: list["CategoryTreeNode"] = []


# --- filters -----------------------------------------------------------------


class FilterGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    unit: str | None = Field(default=None, max_length=32)
    position: int = 0
    is_active: bool = True


class FilterGroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    unit: str | None = Field(default=None, max_length=32)
    position: int | None = None
    is_active: bool | None = None


class FilterValueCreate(BaseModel):
    filter_group_id: uuid.UUID
    value: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    position: int = 0


class FilterValueUpdate(BaseModel):
    value: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    position: int | None = None


class FilterValueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filter_group_id: uuid.UUID
    value: str
    slug: str
    position: int


class FilterGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    unit: str | None
    position: int
    is_active: bool


class FilterGroupWithValues(FilterGroupResponse):
    values: list[FilterValueResponse] = []


# --- products ----------------------------------------------------------------


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    sku: str | None = Field(default=None, max_length=100)
    short_description: str | None = Field(default=None, max_length=512)
    description: str | None = None
    specifications: dict = {}
    images: list[str] = []
    # Per-piece rates; B2B is the bulk/discounted rate, charged from b2b_min_qty up.
    price_b2c: float | None = Field(default=None, ge=0)
    price_b2b: float | None = Field(default=None, ge=0)
    b2b_min_qty: int = Field(default=1, ge=1, le=9999)
    is_active: bool = True
    position: int = 0
    # Must reference leaf categories. The first (or primary_category_id, if given)
    # becomes the canonical category.
    category_ids: list[uuid.UUID] = []
    primary_category_id: uuid.UUID | None = None
    filter_value_ids: list[uuid.UUID] = []


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    sku: str | None = Field(default=None, max_length=100)
    short_description: str | None = Field(default=None, max_length=512)
    description: str | None = None
    specifications: dict | None = None
    images: list[str] | None = None
    price_b2c: float | None = Field(default=None, ge=0)
    price_b2b: float | None = Field(default=None, ge=0)
    b2b_min_qty: int | None = Field(default=None, ge=1, le=9999)
    is_active: bool | None = None
    position: int | None = None
    # When provided, replaces the existing set of links.
    category_ids: list[uuid.UUID] | None = None
    primary_category_id: uuid.UUID | None = None
    filter_value_ids: list[uuid.UUID] | None = None


class ProductCategoryRef(BaseModel):
    category_id: uuid.UUID
    name: str
    slug: str
    path: str
    is_primary: bool


class ProductFilterValueRef(BaseModel):
    id: uuid.UUID
    value: str
    slug: str
    group_id: uuid.UUID
    group_name: str


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    sku: str | None
    short_description: str | None
    description: str | None
    specifications: dict
    images: list
    price_b2c: float | None
    price_b2b: float | None
    b2b_min_qty: int
    is_active: bool
    position: int
    categories: list[ProductCategoryRef] = []
    filter_values: list[ProductFilterValueRef] = []
    created_at: datetime
    updated_at: datetime


# --- listing / facets --------------------------------------------------------


class FacetValue(BaseModel):
    id: uuid.UUID
    value: str
    slug: str
    count: int


class Facet(BaseModel):
    group_id: uuid.UUID
    group_name: str
    unit: str | None
    values: list[FacetValue] = []


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    facets: list[Facet] = []


class ProductSitemapItem(BaseModel):
    """Minimal product fields for building the storefront sitemap."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    updated_at: datetime
