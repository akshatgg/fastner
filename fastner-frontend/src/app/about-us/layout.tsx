import type { Metadata } from "next";

import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Us",
  description: `${siteConfig.name} is a new-age industrial fastener supplier for manufacturers, builders and workshops across India — genuine quality, honest pricing and fast nationwide shipping.`,
  alternates: { canonical: "/about-us" },
  openGraph: {
    type: "website",
    title: `About Us | ${siteConfig.name}`,
    description: `${siteConfig.name} — the fastener partner built for modern industry.`,
    url: "/about-us",
    siteName: siteConfig.name,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
