/**
 * API client configuration.
 * Base URL empty = relative to current origin (same-origin /api/*).
 */

export const API_BASE_URL = "";

export const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

export const DEFAULT_REQUEST_INIT: RequestInit = {
  credentials: "same-origin",
};
