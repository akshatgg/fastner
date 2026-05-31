/** Types mirroring the backend `app/catalog/schemas.py` contracts. */

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
