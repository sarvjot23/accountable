// The top bar (LAY-2).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithApp } from '../test/render';
import { TopBar } from './TopBar';

beforeEach(() => {
  mockApi({ 'GET /deals': [], 'GET /contacts': [], 'GET /organizations': [] });
});

describe('TopBar', () => {
  it('[LAY-2] shows the wordmark, linking to the dashboard', () => {
    renderWithApp(<TopBar />);
    expect(screen.getByRole('link', { name: 'Accountable, go to the dashboard' })).toHaveAttribute('href', '/');
  });

  it('[LAY-2] has a tab for each section, in order', () => {
    renderWithApp(<TopBar />);
    const tabs = within(screen.getByRole('navigation', { name: 'Sections' })).getAllByRole('link');
    expect(tabs.map((t) => t.textContent)).toEqual(['Dashboard', 'Pipeline', 'Deals', 'Organizations', 'Contacts']);
  });

  it('[LAY-2] marks the current tab, also on a record inside its section', () => {
    renderWithApp(<TopBar />, { route: '/deals/4' });
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }));
    expect(nav.getByRole('link', { name: 'Deals' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('[LAY-2] marks Dashboard only on the dashboard itself', () => {
    renderWithApp(<TopBar />, { route: '/' });
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }));
    expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Pipeline' })).not.toHaveAttribute('aria-current');
  });

  it('[LAY-2] has the search box and an Add deal button that opens the deal form', async () => {
    renderWithApp(<TopBar />);
    expect(screen.getByRole('combobox', { name: 'Search deals, people and companies' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add deal' }));
    expect(await screen.findByRole('dialog', { name: 'Add deal' })).toBeInTheDocument();
  });
});
