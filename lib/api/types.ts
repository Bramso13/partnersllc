/**
 * Types for the useApi hook and API layer.
 * @see docs/architecture/dev-agent-api-conventions.md
 */

/** Single request in a batch call */
export type BatchRequest = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

/** Result for one request in a batch (data or error, not both) */
export type BatchResult<T = unknown> = {
  data?: T;
  error?: string;
};

/** API error response shape (server may return { error: string, ... }) */
export type ApiErrorPayload = {
  error?: string;
  [key: string]: unknown;
};
