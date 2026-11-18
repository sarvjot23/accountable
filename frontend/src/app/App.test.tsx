// The app shell: top bar over each page, routing and query defaults (LAY-1, LAY-2).
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ApiError } from '../lib/api';
import { dashboard } from '../test/fixtures';
import { mockApi } from '../test/render';
import { App, makeQueryClient } from './App';

function goTo(path: string) {
  act(() => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

beforeEach(() => {
  // jsdom has no scrolling; the router restores the scroll position on each page.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  mockApi({ 'GET /dashboard': dashboard(), 'GET /deals': [], 'GET /contacts': [], 'GET /organizations': [] });
});

describe('App', () => {
  it('[LAY-1] opens on the dashboard, under the top bar', async () => {
    goTo('/');
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('won so far this month');
  });

  it('[LAY-2] moves between sections with the tabs', async () => {
    goTo('/');
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }));
    await userEvent.click(nav.getByRole('link', { name: 'Contacts' }));
    expect(window.location.pathname).toBe('/contacts');
    expect(nav.getByRole('link', { name: 'Contacts' })).toHaveAttribute('aria-current', 'page');
  });

  it('points the way back from an address that leads nowhere', () => {
    goTo('/nowhere');
    render(<App />);
    expect(screen.getByText("There's nothing here. Use the tabs above to find your way back.")).toBeInTheDocument();
  });
});

describe('makeQueryClient', () => {
  const retry = makeQueryClient().getDefaultOptions().queries!.retry as (count: number, error: Error) => boolean;

  it('does not ask again for a record that is missing or refused', () => {
    expect(retry(0, new ApiError('Not found', 404))).toBe(false);
    expect(retry(0, new ApiError('Invalid', 422))).toBe(false);
  });

  it('asks up to twice more when the server fails or cannot be reached', () => {
    expect(retry(0, new ApiError('Server error', 500))).toBe(true);
    expect(retry(1, new ApiError('Offline', 0))).toBe(true);
    expect(retry(2, new Error('Offline'))).toBe(false);
  });
});
