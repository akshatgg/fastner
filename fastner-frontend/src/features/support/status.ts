/** Display metadata for ticket statuses (shared across storefront + admin). */
import type { TicketStatus } from "./types";

const BADGES: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In progress", cls: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-700" },
  closed: { label: "Closed", cls: "bg-ink-200 text-ink-600" },
};

export function ticketStatusBadge(status: TicketStatus) {
  return BADGES[status] ?? { label: status, cls: "bg-ink-100 text-ink-600" };
}

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];
