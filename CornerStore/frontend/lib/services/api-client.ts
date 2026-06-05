import { TOKEN_KEY } from "@/lib/constants/storage";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL;
  if (typeof window === "undefined" && internal) {
    return internal.replace(/\/$/, "");
  }

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    console.warn("NEXT_PUBLIC_API_URL is not set; defaulting to http://localhost:5141/api");
    return "http://localhost:5141/api";
  }
  return base.replace(/\/$/, "");
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | undefined | null>;
  skipAuth?: boolean;
};

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.title === "string") return body.title;
    if (body.errors && typeof body.errors === "object") {
      const messages = Object.values(body.errors as Record<string, string[]>)
        .flat()
        .filter(Boolean);
      if (messages.length) return messages.join(". ");
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, skipAuth, headers: customHeaders, ...init } = options;
  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(buildUrl(path, params), { ...init, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Server-side fetch for public endpoints (no auth token) */
export async function serverApiClient<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  revalidate = 60,
): Promise<T> {
  const url = buildUrl(path, params);
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  return res.json() as Promise<T>;
}

/** Multipart upload for admin product images */
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers();
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${base}${normalizedPath}`, {
    method: "POST",
    headers,
    body: form,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  return res.json() as Promise<T>;
}
