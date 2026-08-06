/** Razorpay Checkout helpers — lazily load the gateway script and open it for
 *  an already-created order. The backend owns the keys; nothing here activates
 *  until `/payments/config` reports `enabled`. */
import type {
  RazorpayCallbackResponse,
  RazorpayOrder,
} from "@/features/payments/types";

const SDK_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCallbackResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };
type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

/** Inject the Razorpay Checkout script once. Resolves true when it's ready. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type OpenCheckoutArgs = {
  order: RazorpayOrder;
  customer: { name: string; email?: string | null; contact?: string | null };
  onSuccess: (response: RazorpayCallbackResponse) => void;
  onDismiss?: () => void;
};

/** Open Razorpay Checkout for an order. Returns false if the SDK isn't loaded. */
export function openRazorpayCheckout({
  order,
  customer,
  onSuccess,
  onDismiss,
}: OpenCheckoutArgs): boolean {
  if (typeof window === "undefined" || !window.Razorpay) return false;

  const rzp = new window.Razorpay({
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    order_id: order.order_id,
    name: "IBC Fasteners",
    description: "Order payment",
    prefill: {
      name: customer.name,
      email: customer.email ?? undefined,
      contact: customer.contact ?? undefined,
    },
    theme: { color: "#ec3a26" },
    handler: onSuccess,
    modal: onDismiss ? { ondismiss: onDismiss } : undefined,
  });
  rzp.open();
  return true;
}
