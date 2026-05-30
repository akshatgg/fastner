import type { Metadata } from "next";

import { getProductServer } from "@/lib/api/public-server";
import { absoluteUrl, productJsonLd, siteConfig } from "@/lib/seo";
import ProductView from "./ProductView";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

function describe(p: {
  name: string;
  short_description: string | null;
  description: string | null;
}): string {
  const raw = p.short_description || p.description || `${p.name} from ${siteConfig.name}.`;
  return raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductServer(slug);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: true },
    };
  }

  const description = describe(product);
  const canonical = `/product/${slug}`;
  const image = product.images?.[0] ? absoluteUrl(product.images[0]) : siteConfig.ogImage;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: canonical,
      siteName: siteConfig.name,
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductServer(slug);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
        />
      )}
      <ProductView slug={slug} />
    </>
  );
}
