/** Types mirroring the backend `app/payments/schemas.py` contracts. */

export type PaymentConfig = {
  /** True once Razorpay keys are set on the backend (test on dev, live on prod). */
  enabled: boolean;
  /** Publishable key id, or null when payments are disabled. */
  key_id: string | null;
};

export type RazorpayOrder = {
  order_id: string;
  amount: number; // paise
  currency: string;
  key_id: string;
};

/** The fields Razorpay Checkout hands back on a successful payment. */
export type RazorpayCallbackResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
