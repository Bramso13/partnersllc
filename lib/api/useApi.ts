"use client";

import { API_BASE_URL, DEFAULT_HEADERS, DEFAULT_REQUEST_INIT } from "./constants";
import type { ApiErrorPayload, BatchRequest, BatchResult } from "./types";

/**
 * Centralized API client hook. Use this instead of raw fetch() in components.
 * @see docs/architecture/dev-agent-api-conventions.md
 */
export function useApi() {
  const baseUrl = API_BASE_URL;

  /**
   * If response is not ok, reads error message from JSON and throws.
   * Never swallows errors; caller should catch and toast or handle UI.
   */
  async function handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let message = "Request failed";
      if (isJson) {
        try {
          const payload: ApiErrorPayload = await response.json();
          message = typeof payload.error === "string" ? payload.error : message;
        } catch {
          // keep default message
        }
      }
      throw new Error(message);
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }
    if (!isJson) {
      const text = await response.text();
      return text as unknown as T;
    }
    return response.json() as Promise<T>;
  }

  async function get<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_INIT,
      ...options,
      method: "GET",
      headers: { ...DEFAULT_HEADERS, ...options?.headers } as HeadersInit,
    });
    return handleResponse<T>(response);
  }

  async function post<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_INIT,
      ...options,
      method: "POST",
      headers: { ...DEFAULT_HEADERS, ...options?.headers } as HeadersInit,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  }

  async function put<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_INIT,
      ...options,
      method: "PUT",
      headers: { ...DEFAULT_HEADERS, ...options?.headers } as HeadersInit,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  }

  async function patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_INIT,
      ...options,
      method: "PATCH",
      headers: { ...DEFAULT_HEADERS, ...options?.headers } as HeadersInit,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  }

  async function deleteMethod<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_INIT,
      ...options,
      method: "DELETE",
      headers: { ...DEFAULT_HEADERS, ...options?.headers } as HeadersInit,
    });
    return handleResponse<T>(response);
  }

  /**
   * Execute multiple requests in parallel. Each result is { data?: T, error?: string }.
   * Caller must check each result for error.
   */
  async function batch<T = unknown>(
    requests: BatchRequest[]
  ): Promise<BatchResult<T>[]> {
    const results = await Promise.all(
      requests.map(async (req): Promise<BatchResult<T>> => {
        const method = req.method ?? "GET";
        const url = `${baseUrl}${req.path}`;
        try {
          const response = await fetch(url, {
            ...DEFAULT_REQUEST_INIT,
            method,
            headers: { ...DEFAULT_HEADERS } as HeadersInit,
            body:
              method !== "GET" && req.body !== undefined
                ? JSON.stringify(req.body)
                : undefined,
          });
          if (!response.ok) {
            let message = "Request failed";
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              try {
                const payload: ApiErrorPayload = await response.json();
                message = typeof payload.error === "string" ? payload.error : message;
              } catch {
                // keep default
              }
            }
            return { error: message };
          }
          if (response.status === 204 || response.headers.get("content-length") === "0") {
            return { data: undefined as T };
          }
          if (response.headers.get("content-type")?.includes("application/json")) {
            const data = (await response.json()) as T;
            return { data };
          }
          const text = await response.text();
          return { data: text as unknown as T };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return { error: message };
        }
      })
    );
    return results;
  }

  return {
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
    batch,
  };
}
