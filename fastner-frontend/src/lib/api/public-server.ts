/** Server-side fetches against the FastAPI public (no-auth) endpoints.
 *
 *  Used by Server Components, generateMetadata, and the sitemap — where the
 *  client `apiFetch` (which depends on the browser auth store) can't run. All
 *  responses are cached/revalidated so metadata + sitemap stay cheap. */
import type { CategoryTreeNode, Product } from "@/features/catalog/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REVALIDATE_SECONDS = 3600; // 1h

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Backend unreachable at build/request time — degrade gracefully so pages
    // and the sitemap still render instead of throwing.
    return null;
  }
}

export function getProductServer(slug: string) {
  return getJson<Product>(`/catalog/products/${encodeURIComponent(slug)}`);
}

export function getCategoryTreeServer() {
  return getJson<CategoryTreeNode[]>("/catalog/tree");
}

export type SitemapProduct = { slug: string; updated_at: string };

export function getAllProductsServer() {
  return getJson<SitemapProduct[]>("/catalog/products");
}

/** Depth-first search for a category by id, returning it with its ancestor
 *  trail (root → node) — used for breadcrumbs in metadata. */
export function findCategoryWithTrail(
  nodes: CategoryTreeNode[],
  id: string,
  trail: CategoryTreeNode[] = [],
): { node: CategoryTreeNode; trail: CategoryTreeNode[] } | null {
  for (const n of nodes) {
    const here = [...trail, n];
    if (n.id === id) return { node: n, trail: here };
    const found = findCategoryWithTrail(n.children, id, here);
    if (found) return found;
  }
  return null;
}
