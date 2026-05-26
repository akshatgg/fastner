"use client";

import { ArrowLeft } from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  SubmitButton,
} from "@/components/auth/AuthUI";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthHeading
        title="Set a new password"
        subtitle="Choose a strong password you haven't used before."
      />

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <AuthField
          id="password"
          label="New password"
          type="password"
          placeholder="Create a new password"
          autoComplete="new-password"
        />
        <AuthField
          id="confirm"
          label="Confirm new password"
          type="password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
        />
        <SubmitButton>Reset password</SubmitButton>
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
