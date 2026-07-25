"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderTree,
  SlidersHorizontal,
  Factory,
  Users,
  ArrowLeft,
  ClipboardList,
  LifeBuoy,
  Settings,
  Ticket,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import Header from "@/components/layout/Header";
import { useRequireAdmin } from "@/features/catalog/queries";
import { useCurrentUser } from "@/features/auth/queries";

const NAV = [
  { href: "/admin/categories", label: "Categories & Products", Icon: FolderTree },
  { href: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { href: "/admin/coupons", label: "Coupons", Icon: Ticket },
  { href: "/admin/tickets", label: "Support", Icon: LifeBuoy },
  { href: "/admin/filters", label: "Filters", Icon: SlidersHorizontal },
  { href: "/admin/industries", label: "Industries", Icon: Factory },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

/** The nav links — shared between the desktop sidebar and the mobile drawer.
 *  `onNavigate` lets the drawer close itself when a link is tapped. */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
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
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Ensures the user profile is loaded so the role check can run.
  useCurrentUser();
  const isAdmin = useRequireAdmin();
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isAdmin) return null;

  return (
    <>
      <Header />
      <div className="flex flex-1 bg-ink-50">
      {/* Desktop sidebar (≥ lg) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-ink-900">
            Admin
          </p>
          <p className="text-xs text-ink-400">Store dashboard</p>
        </div>
        <SidebarNav />
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-400 transition hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
      </aside>

      {/* Mobile drawer (< lg) */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-ink-950/40"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col overflow-y-auto border-r border-ink-100 bg-white px-4 py-6 shadow-xl">
            <div className="flex items-start justify-between px-2">
              <div>
                <p className="font-display text-lg font-bold uppercase tracking-wide text-ink-900">
                  Admin
                </p>
                <p className="text-xs text-ink-400">Store dashboard</p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-ink-500 transition hover:bg-ink-50 hover:text-ink-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-auto flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-400 transition hover:text-ink-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
          </aside>
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (< lg) */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open admin menu"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-ink-800 transition hover:bg-ink-50"
          >
            <Menu className="h-6 w-6" />
          </button>
          <p className="font-display text-base font-bold uppercase tracking-wide text-ink-900">
            Admin
          </p>
          <Link
            href="/"
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-ink-400 transition hover:text-ink-700"
          >
            <ArrowLeft className="h-4 w-4" /> Site
          </Link>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
      </div>
    </>
  );
}
