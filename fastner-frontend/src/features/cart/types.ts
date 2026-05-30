/** Types mirroring the backend `app/cart/schemas.py` contracts. */

import type { Mode } from "@/lib/store/mode-store";

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  slug: string;
  image_url: string | null;
  short_description: string | null;
  sku: string | null;
  is_active: boolean;
  unit_price: number | null;
  line_total: number | null;
  b2b_min_qty: number;
  created_at: string;
  updated_at: string;
};

export type Cart = {
  mode: Mode;
  items: CartItem[];
  total_items: number;
  total_quantity: number;
  subtotal: number;
};

export type AddToCartInput = {
  product_id: string;
  quantity?: number;
  mode?: Mode;
};
