/** Shared display metadata for order + payment statuses, so badges look the
 *  same on the storefront and in the admin desk. */
import type { OrderStatus, PaymentStatus } from "./types";

type Badge = { label: string; cls: string };

const ORDER_BADGES: Record<OrderStatus, Badge> = {
  pending_approval: { label: "Pending approval", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", cls: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", cls: "bg-green-100 text-green-700" },
  declined: { label: "Declined", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", cls: "bg-ink-200 text-ink-600" },
};

const PAYMENT_BADGES: Record<PaymentStatus, Badge> = {
  unpaid: { label: "Unpaid", cls: "bg-ink-100 text-ink-600" },
  paid: { label: "Paid", cls: "bg-green-100 text-green-700" },
  refund_initiated: { label: "Refund initiated", cls: "bg-amber-100 text-amber-700" },
  refunded: { label: "Refunded", cls: "bg-ink-200 text-ink-600" },
};

export function orderStatusBadge(status: OrderStatus): Badge {
  return ORDER_BADGES[status] ?? { label: status, cls: "bg-ink-100 text-ink-600" };
}

export function paymentStatusBadge(status: PaymentStatus): Badge {
  return PAYMENT_BADGES[status] ?? { label: status, cls: "bg-ink-100 text-ink-600" };
}

/** Customer-facing one-liner describing where the order is in its lifecycle. */
export function orderStatusHint(status: OrderStatus): string {
  switch (status) {
    case "pending_approval":
      return "We've received your order and are reviewing it. You'll be notified once it's approved.";
    case "approved":
      return "Your order has been approved and is being prepared for dispatch.";
    case "shipped":
      return "Your order is on its way.";
    case "delivered":
      return "Your order has been delivered. Thank you for shopping with us!";
    case "declined":
      return "This order was declined. Any payment is being refunded (4–5 working days).";
    case "cancelled":
      return "This order was cancelled.";
    default:
      return "";
  }
}
