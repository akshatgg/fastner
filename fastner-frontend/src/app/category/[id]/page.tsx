import type { Metadata } from "next";

import {
  findCategoryWithTrail,
  getCategoryTreeServer,
} from "@/lib/api/public-server";
import { breadcrumbJsonLd, siteConfig } from "@/lib/seo";
import CategoryView from "./CategoryView";

export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const tree = await getCategoryTreeServer();
  const found = tree ? findCategoryWithTrail(tree, id) : null;

  if (!found) {
    return { title: "Category", robots: { index: false, follow: true } };
  }

  const { node, trail } = found;
  const trailNames = trail.map((c) => c.name).join(" › ");
  const description =
    node.description ||
    `Shop ${node.name} at ${siteConfig.name} — ${trailNames}. Industrial-grade fasteners and tools with B2B & retail pricing.`;
  const canonical = `/category/${id}`;

  return {
    title: node.name,
    description: description.length > 160 ? `${description.slice(0, 157)}…` : description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${node.name} | ${siteConfig.name}`,
      description,
      url: canonical,
      siteName: siteConfig.name,
      images: [{ url: node.image_url || siteConfig.ogImage, alt: node.name }],
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { id } = await params;
  const tree = await getCategoryTreeServer();
  const found = tree ? findCategoryWithTrail(tree, id) : null;

  const crumbs = [
    { name: "Categories", url: "/#categories" },
    ...(found?.trail.map((c) => ({ name: c.name, url: `/category/${c.id}` })) ?? []),
  ];

  return (
    <>
      {found && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
        />
      )}
      <CategoryView id={id} />
    </>
  );
}
