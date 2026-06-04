"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRequireAuth } from "@/features/auth/queries";
import { useAuthStore } from "@/lib/store/auth-store";

const NAV = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/orders", label: "My orders", Icon: Package },
  { href: "/support", label: "Support", Icon: LifeBuoy },
  { href: "/settings", label: "Settings", Icon: Settings },
];

/** Shared shell for the customer dashboard — Header + a persistent sidebar
 *  (mirroring the admin dashboard) + Footer, with the auth guard handled here so
 *  the individual pages only render their content. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const isAuthed = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  if (!isAuthed) return null;

  const initials = (user?.full_name?.trim()[0] ?? "U").toUpperCase();

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Sidebar */}
            <aside className="lg:w-60 lg:shrink-0">
              <div className="rounded-2xl border border-ink-100 bg-white p-3 shadow-card lg:p-4">
                <div className="mb-3 hidden items-center gap-3 px-2 py-2 lg:flex">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {user?.full_name ?? "My account"}
                    </p>
                    <p className="truncate text-xs text-ink-400">{user?.email}</p>
                  </div>
                </div>

                <nav className="flex gap-1 overflow-x-auto lg:flex-col">
                  {NAV.map(({ href, label, Icon }) => {
                    const active =
                      href === "/account"
                        ? pathname === "/account"
                        : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>

                <Link
                  href="/"
                  className="mt-1 hidden items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-400 transition hover:text-ink-700 lg:flex"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to shop
                </Link>
              </div>
            </aside>

            {/* Content */}
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
