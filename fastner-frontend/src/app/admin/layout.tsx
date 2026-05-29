"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, SlidersHorizontal, Factory, Users, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { useRequireAdmin } from "@/features/catalog/queries";
import { useCurrentUser } from "@/features/auth/queries";

const NAV = [
  { href: "/admin/categories", label: "Categories & Products", Icon: FolderTree },
  { href: "/admin/filters", label: "Filters", Icon: SlidersHorizontal },
  { href: "/admin/industries", label: "Industries", Icon: Factory },
  { href: "/admin/users", label: "Users", Icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Ensures the user profile is loaded so the role check can run.
  useCurrentUser();
  const isAdmin = useRequireAdmin();
  const pathname = usePathname();

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-6 sm:flex">
        <div className="px-2">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-ink-900">
            Admin
          </p>
          <p className="text-xs text-ink-400">Catalog dashboard</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-400 transition hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
