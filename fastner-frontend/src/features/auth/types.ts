/** Types mirroring the backend `app/auth/schemas.py` contracts. */

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

/** Signup result. When `requires_verification` is true the tokens are null and
 *  the user must click an email link before they can sign in. */
export type SignUpResponse = {
  requires_verification: boolean;
  message: string;
  access_token: string | null;
  refresh_token: string | null;
  token_type: string;
};

export type MessageResponse = { message: string };

export type SignUpInput = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
};

export type SignInInput = {
  email: string;
  password: string;
};
