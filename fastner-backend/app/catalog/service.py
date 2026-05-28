"""Catalog business logic: the category tree, products, filters, and the
storefront listing/faceting queries.

Invariants enforced here (not by the DB):
  * a category's ``path`` is the slash-joined slug chain and ``depth`` is the
    number of ancestors — both maintained on create/move so reads avoid recursion;
  * a product may only link to *leaf* categories (categories with no children);
  * exactly one of a product's category links is ``is_primary``.
"""

import uuid
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy import delete, distinct, func, select
from sqlalchemy.orm import Session

from app.catalog.helpers import slugify
from app.catalog.models import (
    Category,
    FilterGroup,
    FilterValue,
    Product,
    ProductCategory,
    ProductFilterValue,
)
from app.catalog import schemas


class CatalogService:
    def __init__(self, db: Session):
        self.db = db

    # --- shared helpers ------------------------------------------------------

    def _get_category(self, category_id: uuid.UUID) -> Category:
        cat = self.db.get(Category, category_id)
        if cat is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found.")
        return cat

    def _has_children(self, category_id: uuid.UUID) -> bool:
        return (
            self.db.scalar(
                select(Category.id).where(Category.parent_id == category_id).limit(1)
            )
            is not None
        )

    def _unique_category_slug(
        self, parent_id: uuid.UUID | None, base: str, exclude_id: uuid.UUID | None = None
    ) -> str:
        """Return a slug unique among siblings, appending -2, -3… on collision."""
        slug, n = base, 1
        while True:
            q = select(Category.id).where(
                Category.parent_id == parent_id, Category.slug == slug
            )
            if exclude_id is not None:
                q = q.where(Category.id != exclude_id)
            if self.db.scalar(q) is None:
                return slug
            n += 1
            slug = f"{base}-{n}"

    # --- categories ----------------------------------------------------------

    def create_category(self, data: schemas.CategoryCreate) -> Category:
        parent = self._get_category(data.parent_id) if data.parent_id else None
        base = slugify(data.slug or data.name)
        slug = self._unique_category_slug(data.parent_id, base)
        path = f"{parent.path}/{slug}" if parent else slug
        depth = path.count("/")

        cat = Category(
            parent_id=data.parent_id,
            name=data.name,
            slug=slug,
            path=path,
            depth=depth,
            position=data.position,
            description=data.description,
            image_url=data.image_url,
            is_active=data.is_active,
        )
        self.db.add(cat)
        self.db.commit()
        self.db.refresh(cat)
        return cat

    def update_category(
        self, category_id: uuid.UUID, data: schemas.CategoryUpdate
    ) -> Category:
        cat = self._get_category(category_id)
        fields = data.model_dump(exclude_unset=True)

        moving = "parent_id" in fields and fields["parent_id"] != cat.parent_id
        renaming = "slug" in fields and fields["slug"] is not None
        new_parent_id = fields.get("parent_id", cat.parent_id)

        if moving:
            if new_parent_id == cat.id:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "A category cannot be its own parent.")
            if new_parent_id is not None:
                new_parent = self._get_category(new_parent_id)
                # Reject moving into own subtree (would create a cycle).
                if new_parent.path == cat.path or new_parent.path.startswith(cat.path + "/"):
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        "Cannot move a category into itself or one of its descendants.",
                    )

        # Plain scalar fields.
        for key in ("name", "description", "image_url", "position", "is_active"):
            if key in fields and fields[key] is not None:
                setattr(cat, key, fields[key])

        if renaming:
            cat.slug = self._unique_category_slug(
                new_parent_id, slugify(fields["slug"]), exclude_id=cat.id
            )
        if moving:
            cat.parent_id = new_parent_id

        if moving or renaming:
            self._recompute_subtree(cat)

        self.db.commit()
        self.db.refresh(cat)
        return cat

    def _recompute_subtree(self, cat: Category) -> None:
        """Rewrite ``path``/``depth`` for ``cat`` and every descendant after a
        rename or move. Descendants are matched by the old path prefix."""
        old_path = cat.path
        parent = self.db.get(Category, cat.parent_id) if cat.parent_id else None
        new_path = f"{parent.path}/{cat.slug}" if parent else cat.slug

        descendants = self.db.scalars(
            select(Category).where(Category.path.like(f"{old_path}/%"))
        ).all()

        cat.path = new_path
        cat.depth = new_path.count("/")
        for d in descendants:
            d.path = new_path + d.path[len(old_path):]
            d.depth = d.path.count("/")

    def delete_category(self, category_id: uuid.UUID) -> None:
        cat = self._get_category(category_id)
        if self._has_children(category_id):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Delete or move the subcategories first — this category still has children.",
            )
        # Any product links cascade away; the products themselves remain.
        self.db.delete(cat)
        self.db.commit()

    def get_category(self, category_id: uuid.UUID) -> Category:
        return self._get_category(category_id)

    def get_category_by_path(self, path: str) -> Category:
        cat = self.db.scalar(select(Category).where(Category.path == path))
        if cat is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found.")
        return cat

    def list_categories(self, active_only: bool = False) -> list[Category]:
        q = select(Category).order_by(Category.depth, Category.position, Category.name)
        if active_only:
            q = q.where(Category.is_active.is_(True))
        return list(self.db.scalars(q).all())

    def build_tree(self, active_only: bool = False) -> list[dict]:
        """Assemble the flat category rows into a nested tree of dicts."""
        cats = self.list_categories(active_only=active_only)
        leaf_ids = {c.id for c in cats} - {c.parent_id for c in cats if c.parent_id}
        nodes: dict[uuid.UUID, dict] = {}
        roots: list[dict] = []
        for c in cats:
            node = schemas.CategoryTreeNode.model_validate(
                c, from_attributes=True
            ).model_dump()
            node["is_leaf"] = c.id in leaf_ids
            node["children"] = []
            nodes[c.id] = node
        for c in cats:
            node = nodes[c.id]
            if c.parent_id and c.parent_id in nodes:
                nodes[c.parent_id]["children"].append(node)
            else:
                roots.append(node)
        return roots

    def annotate_is_leaf(self, cat: Category) -> Category:
        # Convenience for single-category responses.
        cat.is_leaf = not self._has_children(cat.id)  # type: ignore[attr-defined]
        return cat

    # --- filter groups & values ---------------------------------------------

    def create_filter_group(self, data: schemas.FilterGroupCreate) -> FilterGroup:
        slug = slugify(data.slug or data.name)
        if self.db.scalar(select(FilterGroup.id).where(FilterGroup.slug == slug)):
            raise HTTPException(status.HTTP_409_CONFLICT, "A filter group with this slug already exists.")
        group = FilterGroup(
            name=data.name, slug=slug, unit=data.unit,
            position=data.position, is_active=data.is_active,
        )
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        return group

    def update_filter_group(
        self, group_id: uuid.UUID, data: schemas.FilterGroupUpdate
    ) -> FilterGroup:
        group = self.db.get(FilterGroup, group_id)
        if group is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Filter group not found.")
        fields = data.model_dump(exclude_unset=True)
        if fields.get("slug"):
            new_slug = slugify(fields["slug"])
            clash = self.db.scalar(
                select(FilterGroup.id).where(
                    FilterGroup.slug == new_slug, FilterGroup.id != group_id
                )
            )
            if clash:
                raise HTTPException(status.HTTP_409_CONFLICT, "A filter group with this slug already exists.")
            group.slug = new_slug
        for key in ("name", "unit", "position", "is_active"):
            if key in fields and fields[key] is not None:
                setattr(group, key, fields[key])
        self.db.commit()
        self.db.refresh(group)
        return group

    def delete_filter_group(self, group_id: uuid.UUID) -> None:
        group = self.db.get(FilterGroup, group_id)
        if group is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Filter group not found.")
        self.db.delete(group)  # values + product links cascade
        self.db.commit()

    def list_filter_groups(self) -> list[FilterGroup]:
        return list(
            self.db.scalars(
                select(FilterGroup).order_by(FilterGroup.position, FilterGroup.name)
            ).all()
        )

    def create_filter_value(self, data: schemas.FilterValueCreate) -> FilterValue:
        group = self.db.get(FilterGroup, data.filter_group_id)
        if group is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Filter group not found.")
        slug = slugify(data.slug or data.value)
        clash = self.db.scalar(
            select(FilterValue.id).where(
                FilterValue.filter_group_id == data.filter_group_id,
                FilterValue.slug == slug,
            )
        )
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, "This value already exists in the group.")
        value = FilterValue(
            filter_group_id=data.filter_group_id, value=data.value,
            slug=slug, position=data.position,
        )
        self.db.add(value)
        self.db.commit()
        self.db.refresh(value)
        return value

    def update_filter_value(
        self, value_id: uuid.UUID, data: schemas.FilterValueUpdate
    ) -> FilterValue:
        value = self.db.get(FilterValue, value_id)
        if value is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Filter value not found.")
        fields = data.model_dump(exclude_unset=True)
        if fields.get("slug"):
            new_slug = slugify(fields["slug"])
            clash = self.db.scalar(
                select(FilterValue.id).where(
                    FilterValue.filter_group_id == value.filter_group_id,
                    FilterValue.slug == new_slug,
                    FilterValue.id != value_id,
                )
            )
            if clash:
                raise HTTPException(status.HTTP_409_CONFLICT, "This value already exists in the group.")
            value.slug = new_slug
        for key in ("value", "position"):
            if key in fields and fields[key] is not None:
                setattr(value, key, fields[key])
        self.db.commit()
        self.db.refresh(value)
        return value

    def delete_filter_value(self, value_id: uuid.UUID) -> None:
        value = self.db.get(FilterValue, value_id)
        if value is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Filter value not found.")
        self.db.delete(value)
        self.db.commit()

    # --- products ------------------------------------------------------------

    def _validate_leaf_categories(self, category_ids: list[uuid.UUID]) -> None:
        for cid in category_ids:
            cat = self.db.get(Category, cid)
            if cat is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"Category {cid} not found.")
            if self._has_children(cid):
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"'{cat.name}' has subcategories — products can only be added to leaf categories.",
                )

    def _validate_filter_values(self, value_ids: list[uuid.UUID]) -> None:
        for vid in value_ids:
            if self.db.get(FilterValue, vid) is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"Filter value {vid} not found.")

    def _set_category_links(
        self,
        product: Product,
        category_ids: list[uuid.UUID],
        primary_id: uuid.UUID | None,
    ) -> None:
        ids = list(dict.fromkeys(category_ids))  # dedupe, keep order
        if primary_id is not None and primary_id not in ids:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "primary_category_id must be one of the selected categories.",
            )
        primary = primary_id or (ids[0] if ids else None)
        for cid in ids:
            self.db.add(
                ProductCategory(
                    product_id=product.id, category_id=cid, is_primary=(cid == primary)
                )
            )

    def _set_filter_links(self, product: Product, value_ids: list[uuid.UUID]) -> None:
        for vid in dict.fromkeys(value_ids):
            self.db.add(
                ProductFilterValue(product_id=product.id, filter_value_id=vid)
            )

    def create_product(self, data: schemas.ProductCreate) -> Product:
        self._validate_leaf_categories(data.category_ids)
        self._validate_filter_values(data.filter_value_ids)

        base = slugify(data.slug or data.name)
        slug, n = base, 1
        while self.db.scalar(select(Product.id).where(Product.slug == slug)):
            n += 1
            slug = f"{base}-{n}"

        if data.sku and self.db.scalar(select(Product.id).where(Product.sku == data.sku)):
            raise HTTPException(status.HTTP_409_CONFLICT, "A product with this SKU already exists.")

        product = Product(
            name=data.name, slug=slug, sku=data.sku,
            short_description=data.short_description, description=data.description,
            specifications=data.specifications, images=data.images,
            is_active=data.is_active, position=data.position,
        )
        self.db.add(product)
        self.db.flush()  # assign product.id before adding links
        self._set_category_links(product, data.category_ids, data.primary_category_id)
        self._set_filter_links(product, data.filter_value_ids)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update_product(
        self, product_id: uuid.UUID, data: schemas.ProductUpdate
    ) -> Product:
        product = self.db.get(Product, product_id)
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found.")
        fields = data.model_dump(exclude_unset=True)

        if "slug" in fields and fields["slug"]:
            new_slug = slugify(fields["slug"])
            clash = self.db.scalar(
                select(Product.id).where(Product.slug == new_slug, Product.id != product_id)
            )
            if clash:
                raise HTTPException(status.HTTP_409_CONFLICT, "A product with this slug already exists.")
            product.slug = new_slug
        if "sku" in fields and fields["sku"]:
            clash = self.db.scalar(
                select(Product.id).where(Product.sku == fields["sku"], Product.id != product_id)
            )
            if clash:
                raise HTTPException(status.HTTP_409_CONFLICT, "A product with this SKU already exists.")
            product.sku = fields["sku"]

        for key in ("name", "short_description", "description", "specifications",
                    "images", "is_active", "position"):
            if key in fields and fields[key] is not None:
                setattr(product, key, fields[key])

        if data.category_ids is not None:
            self._validate_leaf_categories(data.category_ids)
            self.db.execute(
                delete(ProductCategory).where(ProductCategory.product_id == product_id)
            )
            self.db.flush()
            self._set_category_links(product, data.category_ids, data.primary_category_id)
        if data.filter_value_ids is not None:
            self._validate_filter_values(data.filter_value_ids)
            self.db.execute(
                delete(ProductFilterValue).where(ProductFilterValue.product_id == product_id)
            )
            self.db.flush()
            self._set_filter_links(product, data.filter_value_ids)

        self.db.commit()
        self.db.refresh(product)
        return product

    def delete_product(self, product_id: uuid.UUID) -> None:
        product = self.db.get(Product, product_id)
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found.")
        self.db.delete(product)
        self.db.commit()

    def get_product(self, product_id: uuid.UUID) -> Product:
        product = self.db.get(Product, product_id)
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found.")
        return product

    def get_product_by_slug(self, slug: str) -> Product:
        product = self.db.scalar(select(Product).where(Product.slug == slug))
        if product is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found.")
        return product

    def to_product_response(self, product: Product) -> schemas.ProductResponse:
        cats = [
            schemas.ProductCategoryRef(
                category_id=link.category.id, name=link.category.name,
                slug=link.category.slug, path=link.category.path,
                is_primary=link.is_primary,
            )
            for link in product.category_links
        ]
        cats.sort(key=lambda c: (not c.is_primary, c.name))
        fvs = [
            schemas.ProductFilterValueRef(
                id=link.filter_value.id, value=link.filter_value.value,
                slug=link.filter_value.slug,
                group_id=link.filter_value.filter_group_id,
                group_name=link.filter_value.group.name,
            )
            for link in product.filter_value_links
        ]
        return schemas.ProductResponse(
            id=product.id, name=product.name, slug=product.slug, sku=product.sku,
            short_description=product.short_description, description=product.description,
            specifications=product.specifications, images=product.images,
            is_active=product.is_active, position=product.position,
            categories=cats, filter_values=fvs,
            created_at=product.created_at, updated_at=product.updated_at,
        )

    # --- storefront listing (roll-up + facets) -------------------------------

    def _subtree_category_ids(self, cat: Category) -> list[uuid.UUID]:
        """The category itself plus every descendant (matched on path prefix)."""
        descendants = self.db.scalars(
            select(Category.id).where(Category.path.like(f"{cat.path}/%"))
        ).all()
        return [cat.id, *descendants]

    def list_products_in_category(
        self,
        category_id: uuid.UUID,
        filter_value_ids: list[uuid.UUID],
        page: int,
        page_size: int,
        active_only: bool = True,
    ) -> schemas.ProductListResponse:
        cat = self._get_category(category_id)
        subtree_ids = self._subtree_category_ids(cat)

        product_ids_in_cat = (
            select(distinct(ProductCategory.product_id))
            .where(ProductCategory.category_id.in_(subtree_ids))
            .scalar_subquery()
        )

        base = select(Product).where(Product.id.in_(product_ids_in_cat))
        if active_only:
            base = base.where(Product.is_active.is_(True))

        # Within a group: OR (any selected value); across groups: AND.
        if filter_value_ids:
            values = self.db.scalars(
                select(FilterValue).where(FilterValue.id.in_(filter_value_ids))
            ).all()
            by_group: dict[uuid.UUID, list[uuid.UUID]] = defaultdict(list)
            for v in values:
                by_group[v.filter_group_id].append(v.id)
            for vids in by_group.values():
                sub = select(ProductFilterValue.product_id).where(
                    ProductFilterValue.filter_value_id.in_(vids)
                )
                base = base.where(Product.id.in_(sub))

        total = self.db.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0

        items = self.db.scalars(
            base.order_by(Product.position, Product.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()

        facets = self._facets_for_products(product_ids_in_cat)

        return schemas.ProductListResponse(
            items=[self.to_product_response(p) for p in items],
            total=total, page=page, page_size=page_size, facets=facets,
        )

    def _facets_for_products(self, product_ids_subq) -> list[schemas.Facet]:
        """Build the filter sidebar: every filter value present on the given
        products, grouped, with a product count per value."""
        rows = self.db.execute(
            select(
                FilterGroup.id, FilterGroup.name, FilterGroup.unit,
                FilterValue.id, FilterValue.value, FilterValue.slug,
                func.count(distinct(ProductFilterValue.product_id)),
            )
            .join(FilterValue, FilterValue.filter_group_id == FilterGroup.id)
            .join(ProductFilterValue, ProductFilterValue.filter_value_id == FilterValue.id)
            .where(ProductFilterValue.product_id.in_(product_ids_subq))
            .group_by(
                FilterGroup.id, FilterGroup.name, FilterGroup.unit,
                FilterGroup.position, FilterValue.id, FilterValue.value,
                FilterValue.slug, FilterValue.position,
            )
            .order_by(FilterGroup.position, FilterValue.position, FilterValue.value)
        ).all()

        facets: dict[uuid.UUID, schemas.Facet] = {}
        for gid, gname, unit, vid, vval, vslug, count in rows:
            facet = facets.get(gid)
            if facet is None:
                facet = schemas.Facet(group_id=gid, group_name=gname, unit=unit, values=[])
                facets[gid] = facet
            facet.values.append(
                schemas.FacetValue(id=vid, value=vval, slug=vslug, count=count)
            )
        return list(facets.values())
