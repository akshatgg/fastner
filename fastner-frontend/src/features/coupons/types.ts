/** Types mirroring the backend `app/coupons/schemas.py` contracts. */

export type DiscountType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Result of validating a code against the current cart. */
export type CouponPreview = {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  message: string | null;
};

export type CouponInput = {
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount?: number | null;
  min_order_amount?: number | null;
  usage_limit?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
};
