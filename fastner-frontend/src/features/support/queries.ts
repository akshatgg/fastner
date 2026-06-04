"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  addMyMessage,
  createTicket,
  getAdminTicket,
  getAdminTickets,
  getMyTicket,
  getMyTickets,
  replyToTicket,
  setTicketStatus,
} from "./api";
import type { CreateTicketInput } from "./types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const ticketKeys = {
  list: ["tickets"] as const,
  detail: (id: string) => ["tickets", id] as const,
  adminList: (status: string) => ["admin-tickets", status] as const,
  adminDetail: (id: string) => ["admin-tickets", "detail", id] as const,
};

// --- customer ---

export function useMyTickets() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ticketKeys.list,
    queryFn: getMyTickets,
    enabled: Boolean(accessToken),
  });
}

export function useMyTicket(id: string | null) {
  return useQuery({
    queryKey: ticketKeys.detail(id ?? ""),
    queryFn: () => getMyTicket(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.list });
      toast.success("Ticket raised — we'll be in touch by email.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not raise the ticket.")),
  });
}

export function useAddMyMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      addMyMessage(id, body),
    onSuccess: (ticket) => {
      qc.setQueryData(ticketKeys.detail(ticket.id), ticket);
      qc.invalidateQueries({ queryKey: ticketKeys.list });
    },
    onError: (e) => toast.error(errorMessage(e, "Could not send your reply.")),
  });
}

// --- admin support inbox ---

export function useAdminTickets(status = "") {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ticketKeys.adminList(status),
    queryFn: () => getAdminTickets(status || undefined),
    enabled: Boolean(accessToken),
  });
}

export function useAdminTicket(id: string | null) {
  return useQuery({
    queryKey: ticketKeys.adminDetail(id ?? ""),
    queryFn: () => getAdminTicket(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateAdminTickets() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin-tickets"] });
}

export function useReplyToTicket() {
  const invalidate = useInvalidateAdminTickets();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      replyToTicket(id, body),
    onSuccess: () => {
      invalidate();
      toast.success("Reply sent — emailed to the customer.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not send the reply.")),
  });
}

export function useSetTicketStatus() {
  const invalidate = useInvalidateAdminTickets();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      setTicketStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Ticket status updated.");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update the status.")),
  });
}
