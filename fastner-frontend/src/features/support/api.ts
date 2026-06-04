/** Raw support-ticket API calls. React Query hooks live in queries.ts. */
import { apiFetch } from "@/lib/api/client";

import type { AdminTicket, CreateTicketInput, Ticket } from "./types";

// --- customer ---

export const createTicket = (input: CreateTicketInput) =>
  apiFetch<Ticket>("/support/tickets", { method: "POST", body: input });

export const getMyTickets = () => apiFetch<Ticket[]>("/support/tickets");

export const getMyTicket = (id: string) =>
  apiFetch<Ticket>(`/support/tickets/${id}`);

export const addMyMessage = (id: string, body: string) =>
  apiFetch<Ticket>(`/support/tickets/${id}/messages`, {
    method: "POST",
    body: { body },
  });

// --- admin support inbox ---

export const getAdminTickets = (status?: string) =>
  apiFetch<AdminTicket[]>(
    `/admin/support/tickets${status ? `?status=${encodeURIComponent(status)}` : ""}`,
  );

export const getAdminTicket = (id: string) =>
  apiFetch<AdminTicket>(`/admin/support/tickets/${id}`);

export const replyToTicket = (id: string, body: string) =>
  apiFetch<AdminTicket>(`/admin/support/tickets/${id}/reply`, {
    method: "POST",
    body: { body },
  });

export const setTicketStatus = (id: string, status: string) =>
  apiFetch<AdminTicket>(`/admin/support/tickets/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
