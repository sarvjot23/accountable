// Test helpers: render inside the app's providers, and fake the API with a fetch mock.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { ToastProvider } from '../ui/Toast';

export function renderWithApp(ui: ReactNode, { route = '/' }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>,
    ),
  };
}

type Handler = (body: unknown, init: RequestInit) => unknown | Promise<unknown>;

/** Mock fetch: routes are "GET /deals" keys; a handler's return value is sent as JSON. */
export function mockApi(routes: Record<string, Handler | unknown>) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? 'GET'} ${url.replace(/^\/api/, '')}`;
    if (!(key in routes)) return new Response(JSON.stringify({ detail: `No mock for ${key}` }), { status: 404 });
    const route = routes[key];
    try {
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      const result = typeof route === 'function' ? await (route as Handler)(body, init) : route;
      return new Response(JSON.stringify(result ?? null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ detail: (e as Error).message }), { status: 422 });
    }
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
