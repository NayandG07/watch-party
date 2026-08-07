/**
 * Centralized API client using axios.
 *
 * Features:
 * - Automatically reads NEXT_PUBLIC_API_URL from env
 * - Attaches access_token from localStorage to every request
 * - Intercepts 401 responses → attempts token refresh → retries
 * - Redirects to /login on refresh failure
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// In the browser, use a relative base URL so requests go through the
// Next.js dev-server rewrite proxy (/api/* → http://localhost:8000/api/*).
// This eliminates CORS preflight issues entirely.
// On the server side (SSR), we need the absolute URL.
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : ""; // relative — proxied by next.config.mjs rewrites

// ── Token storage helpers ──────────────────────────────────────────────────

const TOKEN_KEY = "wp_access_token";

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  clear: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};

// ── Axios instance ─────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Include httpOnly refresh_token cookie
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true",
    "x-forwarded-host": "localhost",
    "x-ms-devtunnel-skip-antiphishing-page": "true",
  },
});

// ── Request interceptor: attach access token ───────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: token refresh on 401 ────────────────────────────

let _refreshing = false;
let _refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string): void {
  _refreshSubscribers.forEach((cb) => cb(token));
  _refreshSubscribers = [];
}

function subscribeRefresh(cb: (token: string) => void): void {
  _refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isUnauthorized = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes("/api/auth/refresh");
    const alreadyRetried = originalRequest._retry;

    if (!isUnauthorized || isRefreshEndpoint || alreadyRetried) {
      return Promise.reject(error);
    }

    if (_refreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve) => {
        subscribeRefresh((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(api(originalRequest));
        });
      });
    }

    _refreshing = true;
    originalRequest._retry = true;

    try {
      const { data } = await api.post<{ access_token: string }>(
        "/api/auth/refresh"
      );
      const newToken = data.access_token;
      tokenStorage.set(newToken);
      onRefreshed(newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      return api(originalRequest);
    } catch {
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    } finally {
      _refreshing = false;
    }
  }
);

export default api;

// ── Typed API helpers ──────────────────────────────────────────────────────

export interface ApiError {
  detail: string | Array<Record<string, unknown>>;
}

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error) && error.response?.data?.detail !== undefined;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const detail = error.response!.data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const msg = detail[0]?.msg;
      return typeof msg === "string" ? msg : "Validation error";
    }
    return "An error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
