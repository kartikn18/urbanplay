import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { authToken } from "./authToken";

const baseURL =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

function isRotateRequest(config: InternalAxiosRequestConfig) {
  return config.url?.includes("/auth/rotate-token");
}

function isAuthLoginRequest(config: InternalAxiosRequestConfig) {
  return config.url?.includes("/auth/login");
}

function shouldAttemptRefresh(status: number | undefined, message: unknown) {
  if (status === 401) return true;
  if (status === 403 && typeof message === "string") {
    return message.toLowerCase().includes("invalid access");
  }
  return false;
}

api.interceptors.request.use((config) => {
  const token = authToken.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    // Required so the runtime can set multipart boundary (do not force application/json).
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (!original) return Promise.reject(error);

    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;
    const message = data?.message ?? data?.error ?? "";

    if (
      original._retry ||
      isRotateRequest(original) ||
      isAuthLoginRequest(original) ||
      !shouldAttemptRefresh(status, message)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const { data: rotateData } = await axios.post<{
        data?: { accesstoken?: string };
      }>(
        `${baseURL}/auth/rotate-token`,
        {},
        { withCredentials: true },
      );
      const newToken = rotateData?.data?.accesstoken;
      if (!newToken) throw new Error("Rotate response missing token");
      authToken.set(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      authToken.set(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }
  },
);

export type ApiErrorBody = {
  message?: string;
  error?: string;
  retry_after?: number;
};

/** Absolute time (ms) when the client may retry, from a 429 body `retry_after` (seconds). */
export function extractRateLimitUntilMs(err: unknown): number | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 429) return null;
  const d = err.response.data as ApiErrorBody | undefined;
  if (typeof d?.retry_after !== "number" || d.retry_after <= 0) return null;
  return Date.now() + d.retry_after * 1000;
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as ApiErrorBody | undefined;
    const serverMsg = d?.message || d?.error;
    if (serverMsg && serverMsg.trim()) return serverMsg;
    if (!err.response) return "Network error. Please check your internet connection.";
    const status = err.response.status;
    if (status >= 500) return "Server error. Please try again in a moment.";
    if (status === 404) return "Requested endpoint was not found.";
    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 422 || status === 400) return "Invalid request. Please check your input.";
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
