/** Raw auth API calls. These are framework-agnostic; React Query hooks in
 *  queries.ts wrap them with caching, loading state and side effects. */
import { apiFetch } from "@/lib/api/client";

import type {
  MessageResponse,
  SignInInput,
  SignUpInput,
  SignUpResponse,
  TokenResponse,
  User,
} from "./types";

export const signupRequest = (input: SignUpInput) =>
  apiFetch<SignUpResponse>("/auth/signup", {
    method: "POST",
    body: input,
    auth: false,
  });

export const verifyEmailRequest = (token: string) =>
  apiFetch<MessageResponse>("/auth/verify-email", {
    method: "POST",
    body: { token },
    auth: false,
  });

export const resendVerificationRequest = (email: string) =>
  apiFetch<MessageResponse>("/auth/resend-verification", {
    method: "POST",
    body: { email },
    auth: false,
  });

export const loginRequest = (input: SignInInput) =>
  apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });

export const meRequest = () => apiFetch<User>("/auth/me");

export const logoutRequest = (refreshToken: string) =>
  apiFetch<void>("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
    auth: false,
  });
