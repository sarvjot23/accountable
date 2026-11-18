// The dashboard page as a whole (DASH-1, DASH-2, LAY-1).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { activity, dashboard } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { DashboardPage } from './DashboardPage';

const funnel = {
  stages: [
    { stage: 'new', label: 'New', value: 100000, count: 4, share: 100 },
    { stage: 'qualified', label: 'Qualified', value: 80000, count: 3, share: 80 },
    { stage: 'proposal', label: 'Proposal', value: 60000, count: 2, share: 60 },
    { stage: 'negotiation', label: 'Negotiation', value: 40000, count: 2, share: 40 },
    { stage: 'won', label: 'Won', value: 20000, count: 1, share: 20 },
  ],
  new_to_won_share: 20,
  new_count: 4,
  won_count: 1,
};

const data = dashboard({
  funnel,
  follow_ups: {
    overdue: 1,
    due_today: 1,
    upcoming: 2,
    items: [
      activity({
        id: 8,
        type: 'call',
        description: 'Send the contract',
        follow_up_date: '2026-11-10',
        follow_up_status: 'overdue',
      }),
    ],
  },
  recent_activity: [activity({ id: 9, description: 'Spoke about scope' })],
});

function panel(title: string) {
  return within(screen.getByRole('region', { name: title }));
}

describe('DashboardPage', () => {
  it('[DASH-1] loads every figure from one call', async () => {
    const fetchMock = mockApi({ 'GET /dashboard': data });
    renderWithApp(<DashboardPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('US$120,000 won so far this month.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/dashboard');
  });

  it('[LAY-1] lays out the figures, charts, funnel, follow-ups and recent activity in titled panels', async () => {
    mockApi({ 'GET /dashboard': data });
    renderWithApp(<DashboardPage />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('region', { name: 'Key figures' })).toBeInTheDocument();
    expect(panel('Revenue won').getByText('Each month, last 12 months · US$240,000 in total')).toBeInTheDocument();
    expect(panel('Sales funnel').getByText('New to Won, by value')).toBeInTheDocument();
    expect(panel('Deals won').getByText('Count each month · 6 deals in 12 months')).toBeInTheDocument();
    expect(panel('Follow-ups').getByText('1 overdue · 3 in the next 14 days')).toBeInTheDocument();
    expect(panel('Follow-ups').getByText('Send the contract')).toBeInTheDocument();
    expect(panel('Recent activity').getByText('Spoke about scope')).toBeInTheDocument();
  });

  it('[DASH-1] says plainly when the figures cannot be loaded', async () => {
    mockApi({
      'GET /dashboard': () => {
        throw new Error('The figures are not available right now.');
      },
    });
    renderWithApp(<DashboardPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('The figures are not available right now.');
  });

  it('[DASH-2] opens the Log activity form', async () => {
    mockApi({ 'GET /dashboard': data, 'GET /contacts': [], 'GET /deals': [] });
    renderWithApp(<DashboardPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Log activity' }));
    expect(await screen.findByRole('dialog', { name: 'Log activity' })).toBeInTheDocument();
  });

  it('[DASH-2] opens the Add deal form', async () => {
    mockApi({ 'GET /dashboard': data, 'GET /contacts': [], 'GET /organizations': [] });
    renderWithApp(<DashboardPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add deal' }));
    expect(await screen.findByRole('dialog', { name: 'Add deal' })).toBeInTheDocument();
  });
});
