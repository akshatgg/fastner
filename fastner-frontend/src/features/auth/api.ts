/** Raw auth API calls. These are framework-agnostic; React Query hooks in
 *  queries.ts wrap them with caching, loading state and side effects. */
import { apiFetch } from "@/lib/api/client";

import type {
  ChangePasswordInput,
  DeleteAccountInput,
  MessageResponse,
  ProfileUpdateInput,
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

export const forgotPasswordRequest = (email: string) =>
  apiFetch<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });

export const resetPasswordRequest = (token: string, password: string) =>
  apiFetch<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    auth: false,
  });

export const loginRequest = (input: SignInInput) =>
  apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });

export const meRequest = () => apiFetch<User>("/auth/me");

export const updateProfileRequest = (input: ProfileUpdateInput) =>
  apiFetch<User>("/auth/me", { method: "PATCH", body: input });

/** Change password while signed in. Returns a fresh token pair (the server
 *  revokes all other sessions and re-issues one for this device). */
export const changePasswordRequest = (input: ChangePasswordInput) =>
  apiFetch<TokenResponse>("/auth/change-password", {
    method: "POST",
    body: input,
  });

/** Permanently delete the signed-in user's account. */
export const deleteAccountRequest = (input: DeleteAccountInput) =>
  apiFetch<void>("/auth/me", { method: "DELETE", body: input });

export const logoutRequest = (refreshToken: string) =>
  apiFetch<void>("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
    auth: false,
  });

// --- admin: user management ---

export const listUsers = () => apiFetch<User[]>("/admin/users");

export const updateUserRole = (id: string, role: "customer" | "admin") =>
  apiFetch<User>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
