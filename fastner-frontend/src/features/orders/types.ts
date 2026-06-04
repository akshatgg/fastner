/** Types mirroring the backend `app/orders/schemas.py` contracts. */

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number | null;
  quantity: number;
  line_total: number;
};

/** Fulfilment lifecycle. */
export type OrderStatus =
  | "pending_approval"
  | "approved"
  | "shipped"
  | "delivered"
  | "declined"
  | "cancelled";

/** Payment lifecycle, tracked independently of fulfilment. */
export type PaymentStatus = "unpaid" | "paid" | "refund_initiated" | "refunded";

export type Order = {
  id: string;
  reference: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  mode: string;
  subtotal: number;
  coupon_code: string | null;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  expected_delivery_date: string | null;
  decline_reason: string | null;
  address_id: string | null;
  razorpay_payment_id: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

/** An order enriched with the buyer's identity (admin order desk). */
export type AdminOrder = Order & {
  customer_name: string | null;
  customer_email: string | null;
};

export type PlaceOrderInput = {
  address_id?: string | null;
  coupon_code?: string | null;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export type ApproveOrderInput = { expected_delivery_date?: string | null };
export type DeclineOrderInput = { reason: string };
export type UpdateOrderStatusInput = {
  status: OrderStatus;
  expected_delivery_date?: string | null;
};
export type SetDeliveryInput = { expected_delivery_date: string | null };
