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

export default function SignInPage() {
  return (
    <AuthShell>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to manage orders, quotes and your account."
      />

      <GoogleButton label="Continue with Google" />
      <Divider label="or sign in with email" />

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
          placeholder="••••••••"
          autoComplete="current-password"
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

        <SubmitButton>Sign In</SubmitButton>
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
