/**
 * EVENTOPS 2026 Centralized API Configuration & Client Helper
 * Supports FastAPI backend URL resolution and consistent authorization headers.
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (orgId) {
    headers["x-organization-id"] = orgId;
  }

  return headers;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const defaultHeaders = getAuthHeaders();
  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errJson.error || errorDetail;
    } catch {
      // Body not JSON
    }
    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
