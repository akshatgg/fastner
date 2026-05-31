import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    """A node in the catalog browse tree.

    Modeled as an adjacency list (self-referencing ``parent_id``) so the tree
    can nest to any depth. ``path``/``depth`` are materialized by the service
    layer on write so reads (breadcrumbs, descendant roll-ups) avoid recursion.
    Products attach only to leaf categories (categories with no children);
    a parent lists its descendants' products via ``path LIKE 'parent/%'``.
    """

    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("parent_id", "slug", name="uq_categories_parent_slug"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # NULL = top-level. RESTRICT: a category with children can't be deleted.
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # Materialized slash-joined slug path, e.g. "screws/flat-slotted/m3".
    path: Mapped[str] = mapped_column(String(1024), nullable=False, index=True)
    depth: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    parent: Mapped["Category | None"] = relationship(
        back_populates="children", remote_side="Category.id"
    )
    children: Mapped[list["Category"]] = relationship(back_populates="parent")
    product_links: Mapped[list["ProductCategory"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )


class Product(Base):
    """A purchasable item. Each size/length variation is its own product row
    (mirrors how the catalog is actually structured). ``specifications`` holds
    the display spec table and ``images`` an array of Cloudinary URLs.
    """

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    sku: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    specifications: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    images: Mapped[list] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    # Pricing. The same product is sold to retail (B2C) and bulk (B2B) buyers;
    # only the per-piece rate differs. ``b2b_min_qty`` is the minimum quantity
    # required to buy at the discounted B2B rate. Prices are nullable so a
    # product can exist before pricing is set (older catalog rows have none).
    price_b2c: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_b2b: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    b2b_min_qty: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default=text("1")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    category_links: Mapped[list["ProductCategory"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    filter_value_links: Mapped[list["ProductFilterValue"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    industry_links: Mapped[list["ProductIndustry"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductCategory(Base):
    """Many-to-many link: a product belongs to one or more leaf categories.

    Exactly one link per product is flagged ``is_primary`` (enforced by a
    partial unique index) and supplies the product's canonical breadcrumb/URL.
    """

    __tablename__ = "product_categories"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    product: Mapped["Product"] = relationship(back_populates="category_links")
    category: Mapped["Category"] = relationship(back_populates="product_links")


class FilterGroup(Base):
    """A faceted-filter dimension, e.g. "Material", "Thread Size", "Length"."""

    __tablename__ = "filter_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    values: Mapped[list["FilterValue"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )


class FilterValue(Base):
    """A selectable option within a :class:`FilterGroup`, e.g. "SS304", "M6"."""

    __tablename__ = "filter_values"
    __table_args__ = (
        UniqueConstraint("filter_group_id", "slug", name="uq_filter_values_group_slug"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    filter_group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("filter_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    group: Mapped["FilterGroup"] = relationship(back_populates="values")
    product_links: Mapped[list["ProductFilterValue"]] = relationship(
        back_populates="filter_value", cascade="all, delete-orphan"
    )


class ProductFilterValue(Base):
    """Many-to-many link: a product carries one or more filter values."""

    __tablename__ = "product_filter_values"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    filter_value_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("filter_values.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    product: Mapped["Product"] = relationship(back_populates="filter_value_links")
    filter_value: Mapped["FilterValue"] = relationship(back_populates="product_links")


class ProductIndustry(Base):
    """Many-to-many link: a product serves one or more industries.

    Industries are the same admin-managed rows shown in the "Industries We
    Serve" section (``app.industries.models.Industry``). Tagging a product with
    an industry surfaces it when that industry is searched (e.g. "aerospace").
    """

    __tablename__ = "product_industries"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    industry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("industries.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    product: Mapped["Product"] = relationship(back_populates="industry_links")
    # Cross-module target resolved by class name from the shared registry.
    industry: Mapped["Industry"] = relationship()  # type: ignore[name-defined]  # noqa: F821
