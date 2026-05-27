/** Thin fetch wrapper for the backend API.
 *
 * Responsibilities:
 *  - prefix the API base URL and JSON-encode bodies
 *  - attach the Bearer access token from the auth store
 *  - on a 401, transparently refresh the access token once and retry
 *  - normalise FastAPI error payloads into a thrown `ApiError`
 */
import { useAuthStore } from "@/lib/store/auth-store";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Attach the access token + enable auto-refresh. Defaults to true. */
  auth?: boolean;
};

async function doFetch(
  path: string,
  { body, auth, headers, ...rest }: FetchOptions,
  token: string | null,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// Dedupe concurrent refreshes so a burst of 401s triggers a single refresh call.
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;

  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return Promise.resolve(null);

  refreshing = (async () => {
    try {
      const res = await doFetch(
        "/auth/refresh",
        { method: "POST", body: { refresh_token: refreshToken }, auth: false },
        null,
      );
      if (!res.ok) {
        clear();
        return null;
      }
      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
      };
      setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    // FastAPI 422 returns an array of validation errors.
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ");
    }
  } catch {
    /* fall through */
  }
  return res.statusText || "Request failed";
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const useAuth = options.auth ?? true;
  const token = useAuth ? useAuthStore.getState().accessToken : null;

  let res = await doFetch(path, options, token);

  if (res.status === 401 && useAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(path, options, newToken);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
