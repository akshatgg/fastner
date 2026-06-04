import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import {
  organizationJsonLd,
  siteConfig,
  websiteJsonLd,
} from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Industrial Hardware",
  alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    ...(siteConfig.twitter ? { site: siteConfig.twitter } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Icons are auto-detected from src/app/{favicon.ico,icon.png,apple-icon.png}
  // (the IBC wrench-and-bolt mark) — no explicit config needed.
  manifest: "/manifest.webmanifest",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-ink-900">
        {/* Pages are reached via full-page (<a>) navigation, so Back/Forward
            shows the cached server-rendered HTML — which for client components
            is their loading state — without React re-hydrating, leaving data
            sections stuck on skeletons and the header logged-out until a manual
            reload. This runs before hydration (independent of React) and forces
            a fresh load on any back/forward navigation, both bfcache restores
            (pageshow.persisted) and non-bfcache ones (the "back_forward"
            navigation type). After reload the nav type is "reload", so it never
            loops. */}
        <Script id="bfcache-reload" strategy="beforeInteractive">
          {`(function(){function bf(){try{var e=performance.getEntriesByType('navigation')[0];return e&&e.type==='back_forward';}catch(_){return false;}}if(bf()){window.location.reload();return;}window.addEventListener('pageshow',function(ev){if(ev.persisted||bf()){window.location.reload();}});})();`}
        </Script>
        {/* Site-wide structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
