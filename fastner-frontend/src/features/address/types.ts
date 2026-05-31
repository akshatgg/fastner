/** Types mirroring the backend `app/address/schemas.py` contracts. */

export type AddressType = "home" | "work" | "other";

export type Address = {
  id: string;
  full_name: string;
  phone: string;
  alt_phone: string | null;
  email: string | null;
  pincode: string;
  line1: string;
  line2: string;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  gst_number: string | null;
  address_type: AddressType;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressInput = {
  full_name: string;
  phone: string;
  alt_phone?: string | null;
  email?: string | null;
  pincode: string;
  line1: string;
  line2: string;
  landmark?: string | null;
  city: string;
  state: string;
  country?: string;
  gst_number?: string | null;
  address_type: AddressType;
  is_default: boolean;
};
