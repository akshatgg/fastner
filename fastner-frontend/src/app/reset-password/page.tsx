"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, XCircle } from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  FormError,
  SubmitButton,
} from "@/components/auth/AuthUI";
import { useResetPassword } from "@/features/auth/queries";

function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  const reset = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A reset link with no token is unusable — guide the user back.
  if (!token) {
    return (
      <AuthShell>
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <XCircle className="h-7 w-7" />
          </span>
        </div>
        <AuthHeading
          title="Invalid reset link"
          subtitle="This link looks incomplete. Please request a new password reset."
        />
        <a
          href="/forgot-password"
          className="block w-full rounded-md bg-brand-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
        >
          Request a new link
        </a>
      </AuthShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    reset.mutate({ token, password });
  };

  return (
    <AuthShell>
      <AuthHeading
        title="Set a new password"
        subtitle="Choose a strong password you haven't used before."
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormError message={error} />
        <AuthField
          id="password"
          label="New password"
          type="password"
          placeholder="Create a new password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={reset.isPending}
        />
        <AuthField
          id="confirm"
          label="Confirm new password"
          type="password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          disabled={reset.isPending}
        />
        <SubmitButton loading={reset.isPending}>Reset password</SubmitButton>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
