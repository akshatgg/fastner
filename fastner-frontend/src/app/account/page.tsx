"use client";

import { BadgeCheck, ShieldAlert } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth } from "@/features/auth/queries";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-ink-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <span className="text-base font-medium text-ink-900">{value || "—"}</span>
    </div>
  );
}

export default function AccountPage() {
  const isAuthed = useRequireAuth();
  const user = useAuthStore((s) => s.user);

  // While redirecting an anonymous visitor, render nothing.
  if (!isAuthed) return null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="My Account"
            title="Account details"
            description="Your IBC account information and order contact details."
            align="left"
          />

          <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
                {(user?.full_name?.trim()[0] ?? "U").toUpperCase()}
              </span>
              <div>
                <p className="font-display text-xl font-bold uppercase text-ink-900">
                  {user?.full_name}
                </p>
                {user?.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <BadgeCheck className="h-4 w-4" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                    <ShieldAlert className="h-4 w-4" /> Not verified
                  </span>
                )}
              </div>
            </div>

            <Detail label="Full name" value={user?.full_name ?? ""} />
            <Detail label="Email" value={user?.email ?? ""} />
            <Detail label="Phone" value={user?.phone ?? ""} />
            <Detail label="Account type" value={user?.role ?? ""} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
