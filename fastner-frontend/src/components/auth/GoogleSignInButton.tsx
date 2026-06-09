"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { GoogleButton } from "@/components/auth/AuthUI";
import { useGoogleLogin } from "@/features/auth/queries";
import { loadGoogleIdentityScript } from "@/lib/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Google Sign-In button (ID-token flow).
 *
 * With a client ID configured it renders Google's official button; the returned
 * credential (a signed Google ID token) is posted to `/auth/google`, which
 * verifies it and signs the user in — creating the account on first use. Without
 * a client ID it falls back to a styled placeholder so the auth pages still look
 * complete in local/dev setups that haven't wired Google yet. */
export default function GoogleSignInButton({
  text = "continue_with",
  fallbackLabel = "Continue with Google",
}: {
  text?: "signin_with" | "signup_with" | "continue_with";
  fallbackLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const googleLogin = useGoogleLogin();
  // Hold the latest mutate in a ref so the one-time GIS setup effect doesn't
  // need the mutation object (which is a new identity each render) as a dep.
  const loginRef = useRef(googleLogin.mutate);
  loginRef.current = googleLogin.mutate;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        const el = containerRef.current;
        if (cancelled || !el || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response.credential) loginRef.current(response.credential);
          },
          ux_mode: "popup",
        });
        // GIS needs an explicit pixel width (200–400). Track the container.
        const width = Math.min(Math.max(el.offsetWidth || 320, 200), 400);
        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          logo_alignment: "center",
          width,
        });
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load Google sign-in.");
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) {
    return (
      <GoogleButton
        label={fallbackLabel}
        onClick={() => toast.error("Google sign-in isn't configured yet.")}
      />
    );
  }

  // Google renders its button into this container; min-height avoids a layout
  // shift while the script loads.
  return (
    <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
  );
}
