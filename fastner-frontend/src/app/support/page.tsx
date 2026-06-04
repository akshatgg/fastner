"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LifeBuoy, Plus, Send } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { useRequireAuth } from "@/features/auth/queries";
import {
  useAddMyMessage,
  useCreateTicket,
  useMyTicket,
  useMyTickets,
} from "@/features/support/queries";
import { ticketStatusBadge } from "@/features/support/status";
import type { Ticket } from "@/features/support/types";

const inputCls =
  "w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500";

const CATEGORIES = ["general", "order", "payment", "product", "other"];

function formatTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SupportPage() {
  const isAuthed = useRequireAuth();
  if (!isAuthed) return null;
  return (
    <>
      <Header />
      <main className="flex-1 bg-ink-50 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Help & support"
            title="Support tickets"
            description="Raise a ticket and our team will reply here and to your account email."
            align="left"
          />
          <Suspense
            fallback={<div className="mt-8 h-64 animate-pulse rounded-2xl bg-white" />}
          >
            <SupportInner />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SupportInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const orderRef = params.get("ref");

  const { data: tickets, isLoading } = useMyTickets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const list = useMemo(() => tickets ?? [], [tickets]);

  // Deep-linked from an order ("Raise a ticket") → open the compose form.
  useEffect(() => {
    if (orderId) setComposing(true);
  }, [orderId]);

  // Default to the most recent ticket once they load (unless composing).
  useEffect(() => {
    if (!composing && selectedId === null && list.length > 0 && !orderId) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId, composing, orderId]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar: ticket list */}
      <aside className="space-y-3">
        <button
          onClick={() => {
            setComposing(true);
            setSelectedId(null);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> New ticket
        </button>

        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-white" />
        ) : list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
            No tickets yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((t) => {
              const badge = ticketStatusBadge(t.status);
              const active = !composing && selectedId === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      setComposing(false);
                      setSelectedId(t.id);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/30"
                        : "border-ink-100 bg-white hover:border-ink-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink-900">
                        {t.subject}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-400">{t.reference}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Main panel */}
      <section>
        {composing ? (
          <NewTicketForm
            orderId={orderId}
            orderRef={orderRef}
            onCreated={(t) => {
              setComposing(false);
              setSelectedId(t.id);
            }}
            onCancel={list.length > 0 ? () => setComposing(false) : undefined}
          />
        ) : selectedId ? (
          <TicketThread ticketId={selectedId} />
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
            <div>
              <LifeBuoy className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-3 text-sm text-ink-500">
                Select a ticket or raise a new one.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function NewTicketForm({
  orderId,
  orderRef,
  onCreated,
  onCancel,
}: {
  orderId: string | null;
  orderRef: string | null;
  onCreated: (t: Ticket) => void;
  onCancel?: () => void;
}) {
  const create = useCreateTicket();
  const [subject, setSubject] = useState(orderRef ? `Order ${orderRef}` : "");
  const [category, setCategory] = useState(orderId ? "order" : "general");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const ticket = await create.mutateAsync({
      subject: subject.trim(),
      message: message.trim(),
      category,
      order_id: orderId ?? undefined,
    });
    onCreated(ticket);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="font-display text-lg font-bold uppercase text-ink-900">
        Raise a ticket
      </h2>
      {orderRef && (
        <p className="mt-2 inline-block rounded bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
          Regarding order {orderRef}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <label className={labelCls}>Subject</label>
          <input
            className={inputCls}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly, what's this about?"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Message</label>
          <textarea
            className={inputCls}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's going on and how we can help."
            required
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-500 hover:text-ink-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={create.isPending || !subject.trim() || !message.trim()}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {create.isPending ? "Submitting…" : "Submit ticket"}
        </button>
      </div>
    </form>
  );
}

function TicketThread({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading } = useMyTicket(ticketId);
  const addMessage = useAddMyMessage();
  const [reply, setReply] = useState("");

  if (isLoading || !ticket) {
    return <div className="h-72 animate-pulse rounded-2xl bg-white" />;
  }

  const badge = ticketStatusBadge(ticket.status);
  const closed = ticket.status === "closed";

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await addMessage.mutateAsync({ id: ticket.id, body: reply.trim() });
    setReply("");
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-bold uppercase text-ink-900">
            {ticket.subject}
          </h2>
          <p className="text-xs text-ink-400">
            {ticket.reference}
            {ticket.order_reference && ` · Order ${ticket.order_reference}`}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 px-5 py-5 sm:px-6">
        {ticket.messages.map((m) => {
          const mine = m.author_role === "user";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "bg-brand-500 text-white"
                    : "border border-ink-100 bg-ink-50 text-ink-800"
                }`}
              >
                <p
                  className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${
                    mine ? "text-white/70" : "text-ink-400"
                  }`}
                >
                  {mine ? "You" : "IBC Support"} · {formatTime(m.created_at)}
                </p>
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      <form onSubmit={send} className="border-t border-ink-100 p-4 sm:p-5">
        {closed ? (
          <p className="text-center text-sm text-ink-400">
            This ticket is closed. Replying will reopen it.
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
          />
          <button
            type="submit"
            disabled={addMessage.isPending || !reply.trim()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {addMessage.isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
