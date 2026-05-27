"use client";

import { useState } from "react";

import {
  AuthShell,
  AuthHeading,
  AuthField,
  FormError,
  SubmitButton,
  GoogleButton,
  Divider,
  Checkbox,
} from "@/components/auth/AuthUI";
import { ApiError } from "@/lib/api/client";
import { useLogin, useRedirectIfAuthenticated } from "@/features/auth/queries";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  useRedirectIfAuthenticated();

  const errorMessage = login.isError
    ? login.error instanceof ApiError
      ? login.error.message
      : "Something went wrong. Please try again."
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to manage orders, quotes and your account."
      />

      <GoogleButton label="Continue with Google" />
      <Divider label="or sign in with email" />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormError message={errorMessage} />

        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={login.isPending}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          disabled={login.isPending}
          labelRight={
            <a
              href="/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </a>
          }
        />

        <Checkbox id="remember">Keep me signed in</Checkbox>

        <SubmitButton loading={login.isPending}>Sign In</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        New to IBC?{" "}
        <a
          href="/sign-up"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Create an account
        </a>
      </p>
    </AuthShell>
  );
}
