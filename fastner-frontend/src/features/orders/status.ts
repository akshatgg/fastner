/** Shared display metadata for order + payment statuses, so badges look the
 *  same on the storefront and in the admin desk. */
import type { OrderStatus, PaymentStatus } from "./types";

type Badge = { label: string; cls: string };

const ORDER_BADGES: Record<OrderStatus, Badge> = {
  pending_approval: { label: "Pending approval", cls: "bg-warning-100 text-warning-700" },
  approved: { label: "Approved", cls: "bg-info-100 text-info-700" },
  shipped: { label: "Shipped", cls: "bg-info-100 text-info-700" },
  delivered: { label: "Delivered", cls: "bg-success-100 text-success-700" },
  declined: { label: "Declined", cls: "bg-danger-100 text-danger-700" },
  cancelled: { label: "Cancelled", cls: "bg-ink-200 text-ink-600" },
};

const PAYMENT_BADGES: Record<PaymentStatus, Badge> = {
  unpaid: { label: "Unpaid", cls: "bg-ink-100 text-ink-600" },
  paid: { label: "Paid", cls: "bg-success-100 text-success-700" },
  refund_initiated: { label: "Refund initiated", cls: "bg-warning-100 text-warning-700" },
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
