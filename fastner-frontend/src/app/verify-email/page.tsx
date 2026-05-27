"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { AuthShell, AuthHeading } from "@/components/auth/AuthUI";
import { useVerifyEmail } from "@/features/auth/queries";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const verify = useVerifyEmail();
  // Guard React Strict Mode's double-effect so we only verify once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    verify.mutate(token);
  }, [token, verify]);

  let icon = <Loader2 className="h-7 w-7 animate-spin" />;
  let tone = "bg-brand-50 text-brand-600";
  let title = "Verifying your email…";
  let subtitle = "Hang tight while we confirm your account.";

  if (!token) {
    icon = <XCircle className="h-7 w-7" />;
    tone = "bg-red-50 text-red-600";
    title = "Missing verification token";
    subtitle = "This link looks incomplete. Please use the button in your email.";
  } else if (verify.isSuccess) {
    icon = <CheckCircle2 className="h-7 w-7" />;
    tone = "bg-green-50 text-green-600";
    title = "Email verified";
    subtitle = "Your account is active. You can now sign in.";
  } else if (verify.isError) {
    icon = <XCircle className="h-7 w-7" />;
    tone = "bg-red-50 text-red-600";
    title = "Verification failed";
    subtitle =
      "This link is invalid or has expired. Request a new one from the sign-in page.";
  }

  return (
    <AuthShell>
      <div className="mb-8 flex flex-col items-center text-center">
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>
          {icon}
        </span>
      </div>

      <AuthHeading title={title} subtitle={subtitle} />

      {(verify.isSuccess || verify.isError || !token) && (
        <a
          href="/sign-in"
          className="block w-full rounded-md bg-brand-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
        >
          Go to sign in
        </a>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
