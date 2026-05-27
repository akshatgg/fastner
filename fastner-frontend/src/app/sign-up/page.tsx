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
import { useSignup, useRedirectIfAuthenticated } from "@/features/auth/queries";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const signup = useSignup();
  useRedirectIfAuthenticated();

  const serverError = signup.isError
    ? signup.error instanceof ApiError
      ? signup.error.message
      : "Something went wrong. Please try again."
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setLocalError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    signup.mutate({ full_name: fullName, email, password });
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Create your account"
        subtitle="Order fasteners, track shipments and request bulk quotes."
      />

      <GoogleButton label="Sign up with Google" />
      <Divider label="or sign up with email" />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormError message={localError ?? serverError} />

        <AuthField
          id="name"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
          disabled={signup.isPending}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={signup.isPending}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={signup.isPending}
        />
        <AuthField
          id="confirm"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          disabled={signup.isPending}
        />

        <Checkbox id="terms" checked={agreed} onChange={setAgreed}>
          I agree to the{" "}
          <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
            Privacy Policy
          </a>
          .
        </Checkbox>

        <SubmitButton loading={signup.isPending}>Create Account</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <a
          href="/sign-in"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}
