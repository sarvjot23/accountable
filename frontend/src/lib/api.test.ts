// The fetch wrapper: JSON in and out, errors as plain messages (API-1).
import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { api, ApiError, errorMessage, refreshAfterDelete, refreshAll } from './api';

function respondWith(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response.clone();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('api', () => {
  it('[API-1] sends JSON under /api and returns the parsed reply', async () => {
    const fetchMock = respondWith(json({ id: 3 }));
    await expect(api.post('/deals', { name: 'Cloud migration' })).resolves.toEqual({ id: 3 });
    expect(fetchMock).toHaveBeenCalledWith('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Cloud migration"}',
    });
  });

  it('[API-1] sends no body on a GET', async () => {
    const fetchMock = respondWith(json([]));
    await api.get('/deals');
    expect(fetchMock).toHaveBeenCalledWith('/api/deals', { method: 'GET', headers: undefined, body: undefined });
  });

  it('uses PUT and PATCH for updates', async () => {
    const fetchMock = respondWith(json({}));
    await api.put('/deals/1', {});
    await api.patch('/deals/1/move', {});
    expect(fetchMock.mock.calls.map((c) => (c as unknown[])[1])).toMatchObject([
      { method: 'PUT' },
      { method: 'PATCH' },
    ]);
  });

  it('returns nothing for an empty 204 reply', async () => {
    respondWith(new Response(null, { status: 204 }));
    await expect(api.del('/deals/1')).resolves.toBeUndefined();
  });

  it('[API-1] turns an error reply into its plain-English message and status', async () => {
    respondWith(json({ detail: 'Enter a name' }, 422));
    const error = await api.post('/deals', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Enter a name', status: 422 });
  });

  it('falls back to a general message when the error has no readable detail', async () => {
    respondWith(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(api.get('/deals')).rejects.toMatchObject({ message: 'Something went wrong. Try again.', status: 502 });
    respondWith(json({ detail: [{ msg: 'field required' }] }, 422));
    await expect(api.get('/deals')).rejects.toThrow('Something went wrong. Try again.');
  });

  it('says the server is not answering when the request cannot be made', async () => {
    respondWith(new TypeError('Failed to fetch'));
    await expect(api.get('/deals')).rejects.toMatchObject({
      message: "Accountable's server isn't answering. Check it's running, then try again.",
      status: 0,
    });
  });
});

describe('errorMessage', () => {
  it('shows an error’s own message, or a general one for anything else', () => {
    expect(errorMessage(new Error('That deal is gone'))).toBe('That deal is gone');
    expect(errorMessage('oops')).toBe('Something went wrong. Try again.');
  });
});

describe('refreshing after changes', () => {
  function cachedQueries() {
    const queryClient = new QueryClient();
    const keys = [['deals'], ['deals', 4], ['timeline', 'deals', 4], ['deals', 5], ['contacts', 4]];
    for (const key of keys) queryClient.setQueryData(key, {});
    const stale = () =>
      queryClient
        .getQueryCache()
        .getAll()
        .filter((q) => q.isStale())
        .map((q) => q.queryKey);
    return { queryClient, stale };
  }

  it('[FORM-5] refreshes everything after a save', async () => {
    const { queryClient, stale } = cachedQueries();
    await refreshAll(queryClient);
    expect(stale()).toHaveLength(5);
  });

  it('refreshes everything but the deleted record’s own queries after a delete', async () => {
    const { queryClient, stale } = cachedQueries();
    await refreshAfterDelete(queryClient, 'deals', 4);
    expect(stale()).toEqual([['deals'], ['deals', 5], ['contacts', 4]]);
  });
});
