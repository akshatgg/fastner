"use client";

import { useState } from "react";
import { LifeBuoy, Send } from "lucide-react";

import Modal from "@/components/ui/Modal";
import {
  useAdminTicket,
  useAdminTickets,
  useReplyToTicket,
  useSetTicketStatus,
} from "@/features/support/queries";
import { TICKET_STATUSES, ticketStatusBadge } from "@/features/support/status";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function formatTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminTicketsPage() {
  const [filter, setFilter] = useState("");
  const { data: tickets, isLoading } = useAdminTickets(filter);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = tickets ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink-900">
        Support
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Reply to customer tickets — replies are emailed to the customer.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f.value
                ? "bg-brand-500 text-white"
                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <LifeBuoy className="mx-auto h-9 w-9 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">No tickets here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ticket</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {list.map((t) => {
                  const badge = ticketStatusBadge(t.status);
                  return (
                    <tr key={t.id} className="hover:bg-ink-50/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink-900">{t.subject}</p>
                        <p className="text-xs text-ink-400">
                          {t.reference}
                          {t.order_reference && ` · Order ${t.order_reference}`}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <p className="text-ink-800">{t.customer_name ?? "—"}</p>
                        <p className="text-xs text-ink-400">{t.customer_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedId(t.id)}
                          className="whitespace-nowrap rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title="Ticket"
        widthClass="max-w-2xl"
      >
        {selectedId && <TicketDetail id={selectedId} />}
      </Modal>
    </div>
  );
}

function TicketDetail({ id }: { id: string }) {
  const { data: ticket, isLoading } = useAdminTicket(id);
  const reply = useReplyToTicket();
  const setStatus = useSetTicketStatus();
  const [body, setBody] = useState("");

  if (isLoading || !ticket) {
    return <div className="h-64 animate-pulse rounded-xl bg-ink-50" />;
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await reply.mutateAsync({ id: ticket.id, body: body.trim() });
    setBody("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-ink-900">
            {ticket.subject}
          </p>
          <p className="text-xs text-ink-400">
            {ticket.reference}
            {ticket.order_reference && ` · Order ${ticket.order_reference}`}
          </p>
          <p className="mt-1 break-words text-sm text-ink-600">
            {ticket.customer_name}{" "}
            <span className="text-ink-400">· {ticket.customer_email}</span>
          </p>
        </div>
        <select
          value={ticket.status}
          onChange={(e) => setStatus.mutate({ id: ticket.id, status: e.target.value })}
          className="w-full shrink-0 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500 sm:w-auto"
        >
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ticketStatusBadge(s).label}
            </option>
          ))}
        </select>
      </div>

      {/* Thread */}
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-ink-100 bg-ink-50/40 p-4">
        {ticket.messages.map((m) => {
          const fromAdmin = m.author_role === "admin";
          return (
            <div
              key={m.id}
              className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  fromAdmin
                    ? "bg-brand-500 text-white"
                    : "border border-ink-100 bg-white text-ink-800"
                }`}
              >
                <p
                  className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${
                    fromAdmin ? "text-white/70" : "text-ink-400"
                  }`}
                >
                  {fromAdmin ? "You" : ticket.customer_name ?? "Customer"} ·{" "}
                  {formatTime(m.created_at)}
                </p>
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply */}
      <form onSubmit={send} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply — the customer gets it by email…"
          className="w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={reply.isPending || !body.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {reply.isPending ? "Sending…" : "Reply"}
        </button>
      </form>
    </div>
  );
}
