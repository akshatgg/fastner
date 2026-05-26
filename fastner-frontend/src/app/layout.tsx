import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

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
  title: "IBC — Fastening Solutions, Delivered",
  description:
    "IBC supplies industrial fasteners — screws, bolts, nuts, washers, anchors and tools — with genuine quality and fast shipping.",
  keywords: [
    "fasteners",
    "industrial fasteners",
    "screws",
    "bolts",
    "nuts",
    "washers",
    "anchors",
    "IBC fasteners",
  ],
  openGraph: {
    title: "IBC — Fastening Solutions, Delivered",
    description:
      "Industrial fasteners and fastening solutions. Genuine quality, easy ordering, fast shipping.",
    type: "website",
  },
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
        {children}
      </body>
    </html>
  );
}
