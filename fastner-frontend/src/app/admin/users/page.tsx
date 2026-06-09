"use client";

import { BadgeCheck, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";

import { useCurrentUser, useUpdateUserRole, useUsers } from "@/features/auth/queries";
import type { User } from "@/features/auth/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const roleBadge: Record<string, string> = {
  superadmin: "bg-royal-50 text-royal-700",
  admin: "bg-brand-50 text-brand-700",
  customer: "bg-ink-100 text-ink-600",
};

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: me } = useCurrentUser();

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase text-ink-900">
          Users
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Everyone who has signed up. Promote a customer to admin to give them access
          to this dashboard, or revoke it.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
        {isLoading ? (
          <p className="px-3 py-10 text-center text-sm text-ink-400">Loading…</p>
        ) : users.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink-400">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Role</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {users.map((u) => (
                  <UserRow key={u.id} user={u} isSelf={me?.id === u.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const update = useUpdateUserRole();
  const isAdmin = user.role === "admin" || user.role === "superadmin";
  // Superadmins and your own row aren't editable here.
  const locked = isSelf || user.role === "superadmin";

  return (
    <tr className="hover:bg-ink-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {(user.full_name?.trim()[0] ?? "U").toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-ink-900">
                {user.full_name}
              </span>
              {isSelf && (
                <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-500">
                  you
                </span>
              )}
              {user.is_verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-success-600" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 text-warning-500" />
              )}
            </div>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
            {/* role chip on mobile where the column is hidden */}
            <span
              className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase sm:hidden ${
                roleBadge[user.role] ?? roleBadge.customer
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
            roleBadge[user.role] ?? roleBadge.customer
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 text-ink-500 md:table-cell">
        {formatDate(user.created_at)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {locked ? (
          <span className="text-xs text-ink-300">—</span>
        ) : isAdmin ? (
          <button
            onClick={() => update.mutate({ id: user.id, role: "customer" })}
            disabled={update.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-danger-300 hover:text-danger-600 disabled:opacity-50"
          >
            <ShieldOff className="h-3.5 w-3.5" /> Revoke admin
          </button>
        ) : (
          <button
            onClick={() => update.mutate({ id: user.id, role: "admin" })}
            disabled={update.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Make admin
          </button>
        )}
      </td>
    </tr>
  );
}
