"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Bell, LogOut, Trash2, AlertTriangle } from "lucide-react";

import AccountLayout from "@/components/account/AccountLayout";
import SectionHeading from "@/components/ui/SectionHeading";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  useLogout,
  useCurrentUser,
  useChangePassword,
  useDeleteAccount,
} from "@/features/auth/queries";

const inputCls =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

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

function Field({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-700">{label}</span>
      <input
        type="password"
        value={value}
        autoFocus={autoFocus}
        autoComplete={label.toLowerCase().includes("current") ? "current-password" : "new-password"}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

/** Password & security: a collapsible change-password form. Google-only accounts
 *  (no local password) see an explanatory note instead. */
function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const changePassword = useChangePassword();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords don't match.");
      return;
    }
    changePassword.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <div className="flex items-start gap-4 border-b border-ink-100 py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <KeyRound className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900">Password &amp; security</p>
        {!hasPassword ? (
          <p className="mt-0.5 text-sm text-ink-500">
            You sign in with Google, so there&apos;s no password to manage here.
          </p>
        ) : !open ? (
          <>
            <p className="mt-0.5 text-sm text-ink-500">
              Update your password to keep your account secure.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
            >
              Change password
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-3 max-w-sm space-y-3">
            <Field
              label="Current password"
              value={current}
              onChange={setCurrent}
              autoFocus
            />
            <Field label="New password" value={next} onChange={setNext} />
            <Field
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
            />
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={changePassword.isPending || !current || !next || !confirm}
                className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {changePassword.isPending ? "Saving…" : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** Danger zone: permanently delete the account. Blocked server-side while any
 *  order is still in progress; the backend returns a clear message we surface. */
function DangerZone({ hasPassword }: { hasPassword: boolean }) {
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    deleteAccount.mutate(hasPassword ? { password } : {});
  };

  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-card sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <Trash2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900">Delete account</p>
          <p className="mt-0.5 text-sm text-ink-500">
            Permanently delete your account and all associated data. You can&apos;t
            delete your account while you have an order still in progress.
          </p>

          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          ) : (
            <form onSubmit={submit} className="mt-4 max-w-sm space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This is permanent. Your orders, addresses, reviews and saved
                  details will be removed and can&apos;t be recovered.
                </span>
              </div>
              {hasPassword && (
                <input
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className={inputCls}
                />
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={deleteAccount.isPending || (hasPassword && !password)}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteAccount.isPending ? "Deleting…" : "Yes, delete my account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPassword("");
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const logout = useLogout();
  // Refresh /auth/me so `has_password` is current even for older sessions whose
  // persisted user predates that field.
  const { data: freshUser } = useCurrentUser();
  const storeUser = useAuthStore((s) => s.user);
  const user = freshUser ?? storeUser;
  const hasPassword = user?.has_password ?? true;

  return (
    <AccountLayout>
      <SectionHeading
        eyebrow="Settings"
        title="Account settings"
        description="Manage your security, notifications and session."
        align="left"
      />

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
        <PasswordSection hasPassword={hasPassword} />
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

      <DangerZone hasPassword={hasPassword} />
    </AccountLayout>
  );
}
