"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Pencil,
  ShieldAlert,
  Package,
  LifeBuoy,
  Settings,
  ChevronRight,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRequireAuth, useUpdateProfile } from "@/features/auth/queries";
import AddressBook from "@/features/address/AddressBook";

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

/** An inline-editable phone row: shows the number with an edit pencil, swaps to
 *  an input on click, and saves via PATCH /auth/me. */
function PhoneDetail({ phone }: { phone: string | null }) {
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone ?? "");

  const save = () => {
    update.mutate(
      { phone: value.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="flex flex-col gap-2 border-b border-ink-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        Phone
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setValue(phone ?? "");
                setEditing(false);
              }
            }}
            placeholder="Enter your phone number"
            className="w-48 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={save}
            disabled={update.isPending}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => {
              setValue(phone ?? "");
              setEditing(false);
            }}
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group inline-flex items-center gap-2 text-base font-medium text-ink-900 transition hover:text-brand-600"
        >
          {phone || <span className="text-ink-400">Add phone number</span>}
          <Pencil className="h-4 w-4 text-ink-400 transition group-hover:text-brand-600" />
        </button>
      )}
    </div>
  );
}

/** A tappable nav tile linking to another part of the account area. */
function QuickLink({
  href,
  Icon,
  title,
  desc,
}: {
  href: string;
  Icon: typeof Package;
  title: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink-900">{title}</span>
        <span className="block text-sm text-ink-500">{desc}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-brand-500" />
    </a>
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
            <PhoneDetail phone={user?.phone ?? null} />
            <Detail label="Account type" value={user?.role ?? ""} />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <QuickLink
              href="/orders"
              Icon={Package}
              title="My orders"
              desc="Track and review your orders"
            />
            <QuickLink
              href="/support"
              Icon={LifeBuoy}
              title="Support"
              desc="Get help or raise a ticket"
            />
            <QuickLink
              href="/settings"
              Icon={Settings}
              title="Settings"
              desc="Password & account security"
            />
          </div>

          <div className="mt-8">
            <AddressBook />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
