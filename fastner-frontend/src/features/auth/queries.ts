"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

import {
  forgotPasswordRequest,
  listUsers,
  loginRequest,
  logoutRequest,
  meRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  signupRequest,
  updateProfileRequest,
  updateUserRole,
  verifyEmailRequest,
} from "./api";
import type {
  ProfileUpdateInput,
  SignInInput,
  SignUpInput,
  TokenResponse,
} from "./types";

/** Pull a human-readable message out of an unknown thrown value. */
function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export const authKeys = {
  me: ["auth", "me"] as const,
  users: ["auth", "users"] as const,
};

/** Persist the token pair, then fetch + cache the user profile. */
function useEstablishSession() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  return async (tokens: TokenResponse) => {
    setTokens(tokens.access_token, tokens.refresh_token);
    const user = await meRequest();
    setUser(user);
    return user;
  };
}

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SignUpInput) => signupRequest(input),
    onSuccess: (res, input) => {
      // Verification required: no session yet — point the user at their inbox.
      if (res.requires_verification) {
        toast.success(res.message);
        router.push(`/check-email?email=${encodeURIComponent(input.email)}`);
        return;
      }
      // Account is ready — send them to sign in rather than auto-logging in.
      toast.success("Account created successfully. Please sign in to continue.");
      router.push("/sign-in");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not create your account."));
    },
  });
}

export function useLogin() {
  const establish = useEstablishSession();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: SignInInput) => loginRequest(input),
    onSuccess: async (tokens) => {
      await establish(tokens);
      toast.success("Signed in. Welcome back!");
      router.push("/");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Could not sign you in."));
    },
  });
}

/** Verify an email via the token from the link in the verification email. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmailRequest(token),
    onSuccess: (res) => toast.success(res.message),
    onError: (error) =>
      toast.error(errorMessage(error, "This verification link is invalid.")),
  });
}

/** Re-send the verification email from the "check your inbox" screen. */
export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => resendVerificationRequest(email),
    onSuccess: (res) => toast.success(res.message),
    onError: (error) =>
      toast.error(errorMessage(error, "Could not resend the email.")),
  });
}

/** Request a password-reset email. Always reports success (the backend is
 *  deliberately silent about whether the email is registered). */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordRequest(email),
    onSuccess: (res) => toast.success(res.message),
    onError: (error) =>
      toast.error(errorMessage(error, "Could not send the reset email.")),
  });
}

/** Set a new password from a reset-link token, then route to sign-in. */
export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPasswordRequest(token, password),
    onSuccess: (res) => {
      toast.success(res.message);
      router.push("/sign-in");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not reset your password.")),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      // Best-effort server-side revoke; ignore failures so logout always proceeds.
      if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined);
    },
    onSettled: () => {
      clear();
      queryClient.clear();
      router.push("/sign-in");
    },
  });
}

/** Bounce already-signed-in users away from auth pages (sign-in / sign-up). */
export function useRedirectIfAuthenticated(to = "/") {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    // Defer past the effect flush so the AppRouter is initialized before we
    // dispatch — avoids Next's "Router action dispatched before initialization".
    const id = setTimeout(() => router.replace(to), 0);
    return () => clearTimeout(id);
  }, [accessToken, router, to]);

  return Boolean(accessToken);
}

/** Guard for authenticated-only pages: send anonymous visitors to sign-in. */
export function useRequireAuth(to = "/sign-in") {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) return;
    const id = setTimeout(() => router.replace(to), 0);
    return () => clearTimeout(id);
  }, [accessToken, router, to]);

  return Boolean(accessToken);
}

/** Current user from /auth/me, cached and only fetched when a token exists. */
export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: meRequest,
    enabled: Boolean(accessToken),
  });
}

/** Update the signed-in user's own profile (name, phone) and sync the store. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateProfileRequest(input),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
      toast.success("Profile updated.");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not update your profile.")),
  });
}

// --- admin: user management ---

/** All users, for the admin user-management table. */
export function useUsers() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: authKeys.users,
    queryFn: listUsers,
    enabled: Boolean(accessToken),
  });
}

/** Promote/demote a user between "customer" and "admin". */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: "customer" | "admin" }) =>
      updateUserRole(id, role),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: authKeys.users });
      toast.success(
        user.role === "admin"
          ? `${user.full_name} is now an admin.`
          : `${user.full_name} is now a customer.`,
      );
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not update the user's role.")),
  });
}
