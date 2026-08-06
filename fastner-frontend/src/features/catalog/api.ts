/** Raw catalog API calls. React Query hooks in queries.ts wrap these. */
import { apiFetch } from "@/lib/api/client";

import type {
  Category,
  CategoryCreateInput,
  CategoryTreeNode,
  CategoryUpdateInput,
  FilterGroupWithValues,
  FilterValue,
  Product,
  ProductCreateInput,
  ProductListResponse,
  ProductSearchItem,
  ProductSort,
  ProductUpdateInput,
  SearchResults,
} from "./types";

// --- public (storefront) ---

export const getPublicCategoryTree = (range?: "industrial" | "diy") => {
  const suffix = range ? `?range=${range}` : "";
  return apiFetch<CategoryTreeNode[]>(`/catalog/tree${suffix}`, { auth: false });
};

export const getCategoryProducts = (
  categoryId: string,
  opts: {
    filterValueIds?: string[];
    page?: number;
    pageSize?: number;
    sort?: ProductSort;
    priceMode?: "b2c" | "b2b";
  } = {},
) => {
  const qs = new URLSearchParams();
  for (const id of opts.filterValueIds ?? []) qs.append("filter_value_ids", id);
  if (opts.page) qs.set("page", String(opts.page));
  if (opts.pageSize) qs.set("page_size", String(opts.pageSize));
  if (opts.sort) qs.set("sort", opts.sort);
  if (opts.priceMode) qs.set("price_mode", opts.priceMode);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ProductListResponse>(
    `/catalog/categories/${categoryId}/products${suffix}`,
    { auth: false },
  );
};

export const getPublicProduct = (slug: string) =>
  apiFetch<Product>(`/catalog/products/${slug}`, { auth: false });

export const getRelatedProducts = (slug: string, limit = 8) =>
  apiFetch<ProductSearchItem[]>(
    `/catalog/products/${slug}/related?limit=${limit}`,
    { auth: false },
  );

export const searchCatalog = (q: string, limit = 5) => {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  return apiFetch<SearchResults>(`/catalog/search?${qs.toString()}`, {
    auth: false,
  });
};

// --- categories (admin) ---

export const getCategoryTree = () =>
  apiFetch<CategoryTreeNode[]>("/admin/catalog/categories");

export const createCategory = (input: CategoryCreateInput) =>
  apiFetch<Category>("/admin/catalog/categories", { method: "POST", body: input });

export const updateCategory = (id: string, input: CategoryUpdateInput) =>
  apiFetch<Category>(`/admin/catalog/categories/${id}`, {
    method: "PUT",
    body: input,
  });

export const deleteCategory = (id: string) =>
  apiFetch<void>(`/admin/catalog/categories/${id}`, { method: "DELETE" });

// --- filter groups / values (admin) ---

export const getFilterGroups = () =>
  apiFetch<FilterGroupWithValues[]>("/admin/catalog/filter-groups");

export const createFilterGroup = (input: {
  name: string;
  unit?: string | null;
}) => apiFetch<unknown>("/admin/catalog/filter-groups", { method: "POST", body: input });

export const deleteFilterGroup = (id: string) =>
  apiFetch<void>(`/admin/catalog/filter-groups/${id}`, { method: "DELETE" });

export const createFilterValue = (input: {
  filter_group_id: string;
  value: string;
}) => apiFetch<FilterValue>("/admin/catalog/filter-values", { method: "POST", body: input });

export const deleteFilterValue = (id: string) =>
  apiFetch<void>(`/admin/catalog/filter-values/${id}`, { method: "DELETE" });

// --- products (admin) ---

export const getAdminCategoryProducts = (categoryId: string) =>
  apiFetch<ProductListResponse>(
    `/admin/catalog/categories/${categoryId}/products?page_size=200`,
  );

export const getProduct = (id: string) =>
  apiFetch<Product>(`/admin/catalog/products/${id}`);

export const createProduct = (input: ProductCreateInput) =>
  apiFetch<Product>("/admin/catalog/products", { method: "POST", body: input });

export const updateProduct = (id: string, input: ProductUpdateInput) =>
  apiFetch<Product>(`/admin/catalog/products/${id}`, { method: "PUT", body: input });

export const deleteProduct = (id: string) =>
  apiFetch<void>(`/admin/catalog/products/${id}`, { method: "DELETE" });

export const reorderProducts = (productIds: string[]) =>
  apiFetch<void>("/admin/catalog/products/reorder", {
    method: "PUT",
    body: { product_ids: productIds },
  });
