// The fetch wrapper: JSON in and out, and errors as plain messages (API-1). Only /api is used (APP-3).
import type { QueryClient } from '@tanstack/react-query';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const OFFLINE = "Accountable's server isn't answering. Check it's running, then try again.";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }
  if (!response.ok) {
    let message = 'Something went wrong. Try again.';
    try {
      const payload = await response.json();
      if (typeof payload?.detail === 'string') message = payload.detail;
    } catch {
      // keep the general message
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: (path: string) => request<void>('DELETE', path),
};

/** After any save, refresh everything shown: the data set is small (FORM-5, DASH-1). */
export function refreshAll(queryClient: QueryClient) {
  return queryClient.invalidateQueries();
}

/**
 * After a delete, refresh everything except the deleted record's own queries, so its page
 * (still on screen for a moment while it leaves) never asks for a record that's gone.
 */
export function refreshAfterDelete(queryClient: QueryClient, kind: string, id: number) {
  const gone = (key: readonly unknown[]) => key.includes(kind) && key.includes(id);
  return queryClient.invalidateQueries({ predicate: (q) => !gone(q.queryKey) });
}

/** A message to show for any error. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
