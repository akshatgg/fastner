"use client";

import {
  AuthShell,
  AuthHeading,
  AuthField,
  SubmitButton,
  GoogleButton,
  Divider,
  Checkbox,
} from "@/components/auth/AuthUI";

export default function SignUpPage() {
  return (
    <AuthShell>
      <AuthHeading
        title="Create your account"
        subtitle="Order fasteners, track shipments and request bulk quotes."
      />

      <GoogleButton label="Sign up with Google" />
      <Divider label="or sign up with email" />

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <AuthField
          id="name"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
        />
        <AuthField
          id="confirm"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        <Checkbox id="terms">
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

        <SubmitButton>Create Account</SubmitButton>
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
