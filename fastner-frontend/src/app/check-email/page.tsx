"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";

import { AuthShell, AuthHeading, SubmitButton } from "@/components/auth/AuthUI";
import { useResendVerification } from "@/features/auth/queries";

function CheckEmailContent() {
  const email = useSearchParams().get("email") ?? "";
  const resend = useResendVerification();

  return (
    <AuthShell>
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MailCheck className="h-7 w-7" />
        </span>
      </div>

      <AuthHeading
        title="Check your email"
        subtitle={
          email
            ? `We've sent a verification link to ${email}. Click it to activate your account.`
            : "We've sent you a verification link. Click it to activate your account."
        }
      />

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (email) resend.mutate(email);
        }}
      >
        <p className="text-center text-sm text-ink-500">
          Didn&apos;t get the email? Check your spam folder, or resend it below.
        </p>
        <SubmitButton loading={resend.isPending} disabled={!email}>
          Resend verification email
        </SubmitButton>
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

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}
