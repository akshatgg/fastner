import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";
import {
  getAllProductsServer,
  getCategoryTreeServer,
} from "@/lib/api/public-server";
import type { CategoryTreeNode } from "@/features/catalog/types";

export const revalidate = 3600;

function flattenCategories(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes.flatMap((n) => [n, ...flattenCategories(n.children)]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  // Public, indexable static routes.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/about-us`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const [tree, products] = await Promise.all([
    getCategoryTreeServer(),
    getAllProductsServer(),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = (tree ? flattenCategories(tree) : [])
    .filter((c) => c.is_active)
    .map((c) => ({
      url: `${base}/category/${c.id}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
