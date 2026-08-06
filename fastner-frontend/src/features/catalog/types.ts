/** Types mirroring the backend `app/catalog/schemas.py` contracts. */

/** The two storefront ranges the catalog is split into. A subcategory always
 *  inherits its parent's range, so only top-level categories carry a choice. */
export type CategoryRange = "industrial" | "diy";

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  path: string;
  depth: number;
  position: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  range: CategoryRange;
  is_leaf: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

export type CategoryCreateInput = {
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  position?: number;
  is_active?: boolean;
  // Honoured only for top-level categories; children inherit the parent's range.
  range?: CategoryRange;
};

export type CategoryUpdateInput = Partial<CategoryCreateInput>;

export type FilterValue = {
  id: string;
  filter_group_id: string;
  value: string;
  slug: string;
  position: number;
};

export type FilterGroup = {
  id: string;
  name: string;
  slug: string;
  unit: string | null;
  position: number;
  is_active: boolean;
};

export type FilterGroupWithValues = FilterGroup & { values: FilterValue[] };

export type ProductCategoryRef = {
  category_id: string;
  name: string;
  slug: string;
  path: string;
  is_primary: boolean;
};

export type ProductFilterValueRef = {
  id: string;
  value: string;
  slug: string;
  group_id: string;
  group_name: string;
};

export type ProductIndustryRef = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  specifications: Record<string, unknown>;
  images: string[];
  price_b2c: number | null;
  price_b2b: number | null;
  b2b_min_qty: number;
  is_active: boolean;
  is_out_of_stock: boolean;
  position: number;
  categories: ProductCategoryRef[];
  filter_values: ProductFilterValueRef[];
  industries: ProductIndustryRef[];
  created_at: string;
  updated_at: string;
};

export type ProductCreateInput = {
  name: string;
  slug?: string | null;
  sku?: string | null;
  short_description?: string | null;
  description?: string | null;
  specifications?: Record<string, unknown>;
  images?: string[];
  price_b2c?: number | null;
  price_b2b?: number | null;
  b2b_min_qty?: number;
  is_active?: boolean;
  is_out_of_stock?: boolean;
  position?: number;
  category_ids?: string[];
  primary_category_id?: string | null;
  filter_value_ids?: string[];
  industry_ids?: string[];
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

export type FacetValue = { id: string; value: string; slug: string; count: number };

export type Facet = {
  group_id: string;
  group_name: string;
  unit: string | null;
  values: FacetValue[];
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  facets: Facet[];
};

/** Storefront sort options for a category product listing. Price sorts use the
 *  column for the active buying mode (resolved server-side via `price_mode`). */
export type ProductSort = "featured" | "price_asc" | "price_desc";

// --- search ---

export type ProductSearchItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  image_url: string | null;
  short_description: string | null;
  description: string | null;
  price_b2c: number | null;
  price_b2b: number | null;
  is_out_of_stock?: boolean;
  industries: ProductIndustryRef[];
};

export type CategorySearchItem = {
  id: string;
  name: string;
  slug: string;
  path: string;
  image_url: string | null;
};

export type SearchResults = {
  query: string;
  products: ProductSearchItem[];
  categories: CategorySearchItem[];
};
