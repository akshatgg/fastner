"use client";

import { KeyRound, Bell, LogOut } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useRequireAuth, useLogout } from "@/features/auth/queries";

function SettingRow({
  Icon,
  title,
  description,
}: {
  Icon: typeof KeyRound;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-ink-100 py-5 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const isAuthed = useRequireAuth();
  const logout = useLogout();

  if (!isAuthed) return null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Settings"
            title="Account settings"
            description="Manage your security, notifications and session."
            align="left"
          />

          <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <SettingRow
              Icon={KeyRound}
              title="Password & security"
              description="Update your password and keep your account secure. (Coming soon.)"
            />
            <SettingRow
              Icon={Bell}
              title="Notifications"
              description="Choose which order and account emails you receive. (Coming soon.)"
            />

            <div className="mt-6 border-t border-ink-100 pt-6">
              <button
                type="button"
                onClick={() => logout.mutate()}
                className="inline-flex items-center gap-2 rounded-md bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
