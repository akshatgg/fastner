/** Google Identity Services (GIS) loader + minimal typings.
 *
 * Mirrors the lazy-script pattern in `razorpay.ts`: the GIS client script is
 * injected once, on demand, and the promise is memoised so concurrent callers
 * share a single load. Nothing here runs unless a component asks for it. */

const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = { credential?: string };

type GoogleIdConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: "popup" | "redirect";
  auto_select?: boolean;
};

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonOptions,
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Inject the GIS client script once; resolves when `window.google` is ready. */
export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => {
        scriptPromise = null;
        reject(new Error("Failed to load Google sign-in."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Google sign-in."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export {};
