/** Types mirroring the backend `app/cart/schemas.py` contracts. */

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
  created_at: string;
  updated_at: string;
};

export type Cart = {
  items: CartItem[];
  total_items: number;
  total_quantity: number;
};

export type AddToCartInput = {
  product_id: string;
  quantity?: number;
};
