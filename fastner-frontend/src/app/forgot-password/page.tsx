"use client";

import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  SubmitButton,
} from "@/components/auth/AuthUI";
import { useForgotPassword } from "@/features/auth/queries";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const forgot = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    forgot.mutate(value, { onSuccess: () => setSentTo(value) });
  };

  // Confirmation view — we never reveal whether the email is registered.
  if (sentTo) {
    return (
      <AuthShell>
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
            <MailCheck className="h-7 w-7" />
          </span>
        </div>
        <AuthHeading
          title="Check your email"
          subtitle={`If an account exists for ${sentTo}, we've sent a password reset link. It expires in a couple of hours.`}
        />
        <a
          href="/sign-in"
          className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Forgot password?"
        subtitle="Enter the email tied to your account and we'll send a reset link."
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={forgot.isPending}
        />
        <SubmitButton loading={forgot.isPending}>Send reset link</SubmitButton>
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
