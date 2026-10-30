/**
 * EVENTOPS 2026 Centralized API Configuration & Client Helper
 * All browser API calls use the configured FastAPI URL and the verified auth
 * context from the active EVENTOPS session.
 */
const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/v1";

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("eventops_token") || sessionStorage.getItem("eventops_token");
  }
  return null;
}

export function getActiveOrganizationId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("eventops_org_id");
  }
  return null;
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const orgId = getActiveOrganizationId();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers["x-organization-id"] = orgId;
  return headers;
}

export type ApiRequestError = Error & {
  status?: number;
  code?: string;
  endpoint?: string;
};

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const defaultHeaders = getAuthHeaders();
  const mergedHeaders = {
    ...defaultHeaders,
    ...((options.headers as Record<string, string> | undefined) || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers: mergedHeaders });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const reason = aborted
      ? "The request timed out or was cancelled."
      : "The browser could not complete the API request. This can be caused by network, CORS, TLS, or service connectivity.";
    const failure = new Error(`${reason} API endpoint: ${url}`) as ApiRequestError;
    failure.endpoint = url;
    throw failure;
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    let errorCode: string | undefined;
    try {
      const body = await response.json();
      const detail = body.detail;
      if (typeof detail === "string") {
        errorDetail = detail;
      } else if (detail && typeof detail === "object") {
        errorCode = typeof detail.code === "string" ? detail.code : undefined;
        const parts: string[] = [];
        if (typeof detail.message === "string") parts.push(detail.message);
        if (Array.isArray(detail.problems)) parts.push(...detail.problems.filter((item: unknown): item is string => typeof item === "string"));
        if (Array.isArray(detail.dependencies) && detail.dependencies.every((item: unknown) => typeof item === "string")) {
          parts.push(`Linked records: ${detail.dependencies.join(", ")}.`);
        }
        if (typeof detail.nextStep === "string") parts.push(detail.nextStep);
        errorDetail = parts.join(" ") || JSON.stringify(detail);
      } else if (typeof body.message === "string" || typeof body.error === "string") {
        errorDetail = body.message || body.error;
      }
    } catch {
      // Keep HTTP status when the response is not JSON.
    }

    if (response.status === 401 && mergedHeaders.Authorization && typeof window !== "undefined") {
      // Only clear a session when a request carrying its token is rejected.
      // Public requests without a bearer token must not mutate session state.
      localStorage.removeItem("eventops_token");
      localStorage.removeItem("eventops_org_id");
      localStorage.removeItem("eventops_event_id");
      sessionStorage.removeItem("eventops_token");
      window.dispatchEvent(new CustomEvent("eventops:session-expired"));
    }

    const failure = new Error(errorDetail) as ApiRequestError;
    failure.status = response.status;
    failure.endpoint = url;
    if (errorCode) failure.code = errorCode;
    throw failure;
  }

  if (response.status === 204) return {} as T;
  return response.json();
}
