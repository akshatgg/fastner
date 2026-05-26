"use client";

import { ArrowLeft } from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  SubmitButton,
} from "@/components/auth/AuthUI";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <AuthHeading
        title="Forgot password?"
        subtitle="Enter the email tied to your account and we'll send a reset link."
      />

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
        <SubmitButton>Send reset link</SubmitButton>
      </form>

      <a
        href="/sign-in"
        className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </a>
    </AuthShell>
  );
}
