/** Types mirroring the backend `app/support/schemas.py` contracts. */

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketMessage = {
  id: string;
  author_role: "user" | "admin";
  body: string;
  created_at: string;
};

export type Ticket = {
  id: string;
  reference: string;
  subject: string;
  category: string;
  status: TicketStatus;
  order_id: string | null;
  order_reference: string | null;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
};

export type AdminTicket = Ticket & {
  customer_name: string | null;
  customer_email: string | null;
};

export type CreateTicketInput = {
  subject: string;
  message: string;
  category?: string;
  order_id?: string | null;
};
