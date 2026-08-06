/** Centralised SEO config + structured-data (JSON-LD) builders.
 *
 *  Set the canonical site origin via NEXT_PUBLIC_SITE_URL (no trailing slash),
 *  e.g. https://www.ibcfasteners.com. It must be an absolute URL — it drives
 *  `metadataBase`, canonicals, Open Graph URLs, the sitemap and robots. */
import { SITE, LOGOS } from "@/lib/site-data";

const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ibcfasteners.com";
// Normalise: absolute, no trailing slash.
export const SITE_URL = RAW_URL.replace(/\/+$/, "");

export const siteConfig = {
  url: SITE_URL,
  name: SITE.fullName, // "IBC Fasteners"
  shortName: SITE.name, // "IBC"
  title: "IBC Fasteners — Industrial Fasteners, Bolts, Nuts & Tools",
  description:
    "IBC supplies industrial fasteners — screws, bolts, nuts, washers, anchors and tools — to manufacturers, builders and workshops across India. Genuine quality, B2B & retail pricing, fast nationwide shipping.",
  keywords: [
    "industrial fasteners",
    "fasteners supplier India",
    "bolts and nuts",
    "screws",
    "washers",
    "anchors",
    "wall plugs",
    "hardware tools",
    "B2B fasteners",
    "bulk fasteners",
    "OEM fasteners",
    "IBC Fasteners",
  ],
  locale: "en_IN",
  // Default share image. Replace with a dedicated 1200x630 OG image when ready.
  // encodeURI: the brand logo filename contains spaces, and this lands in
  // <meta> / JSON-LD URLs that must already be escaped.
  ogImage: encodeURI(LOGOS.dark),
  twitter: undefined as string | undefined, // e.g. "@ibcfasteners" when available
};

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = ""): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Organization schema — emitted site-wide from the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    logo: absoluteUrl(encodeURI(LOGOS.dark)),
    description: siteConfig.description,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      email: SITE.email,
      contactType: "sales",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
  };
}

/** WebSite schema — enables the sitelinks search box treatment. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "en-IN",
  };
}

type ProductLike = {
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  images: string[];
  price_b2c: number | null;
  price_b2b: number | null;
  is_active: boolean;
  categories?: { name: string; is_primary: boolean }[];
};

/** Product schema with an Offer — powers rich product results. */
export function productJsonLd(p: ProductLike) {
  const price = p.price_b2c ?? p.price_b2b;
  const category =
    p.categories?.find((c) => c.is_primary)?.name ?? p.categories?.[0]?.name;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description:
      p.short_description || p.description || `${p.name} from ${siteConfig.name}.`,
    image: p.images?.map((src) => absoluteUrl(src)) ?? [],
    ...(p.sku ? { sku: p.sku } : {}),
    ...(category ? { category } : {}),
    brand: { "@type": "Brand", name: siteConfig.shortName },
    url: absoluteUrl(`/product/${p.slug}`),
    ...(price != null
      ? {
          offers: {
            "@type": "Offer",
            price: price,
            priceCurrency: "INR",
            availability: p.is_active
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/product/${p.slug}`),
            seller: { "@type": "Organization", name: siteConfig.name },
          },
        }
      : {}),
  };
}

/** BreadcrumbList schema from an ordered trail of {name, url} crumbs. */
export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.url),
    })),
  };
}
