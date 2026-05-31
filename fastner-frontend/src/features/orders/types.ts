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

export type Order = {
  id: string;
  reference: string;
  status: string;
  mode: string;
  subtotal: number;
  address_id: string | null;
  razorpay_payment_id: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type PlaceOrderInput = {
  address_id?: string | null;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};
