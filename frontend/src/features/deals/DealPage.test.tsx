// A deal's page: its figures, the stage selector, Edit and Delete (REC-1, REC-4, REC-5, DEL-1).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { deal } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Deal } from './api';
import { DealPage } from './DealPage';

function setup(shown: Deal, routes: Record<string, unknown> = {}) {
  const fetchMock = mockApi({
    [`GET /deals/${shown.id}`]: shown,
    [`GET /deals/${shown.id}/timeline`]: [],
    'GET /organizations': [],
    'GET /contacts': [],
    ...routes,
  });
  renderWithApp(
    <Routes>
      <Route path="/deals/:id" element={<DealPage />} />
      <Route path="/deals" element={<p>All deals</p>} />
    </Routes>,
    { route: `/deals/${shown.id}` },
  );
  return fetchMock;
}

const details = () => screen.getByRole('region', { name: 'Details' });

describe('DealPage', () => {
  it('[REC-4] shows the stage, value, probability, expected revenue, close date, organization and contact', async () => {
    setup(
      deal({
        id: 4,
        name: 'Cloud migration',
        stage: 'negotiation',
        value: 180000,
        probability: 60,
        probability_manual: true,
        expected_revenue: 108000,
        close_date: '2026-11-01',
        is_late: true,
        organization_id: 2,
        organization_name: 'Harbor Finance',
        contact_id: 9,
        contact_name: 'Ava Grant',
      }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Cloud migration' })).toBeInTheDocument();
    const panel = details();
    expect(within(panel).getByText('Negotiation')).toBeInTheDocument();
    expect(within(panel).getByText('US$180,000')).toBeInTheDocument();
    expect(within(panel).getByText(/60%/)).toHaveTextContent('60% · set by hand');
    expect(within(panel).getByText('US$108,000')).toBeInTheDocument();
    expect(within(panel).getByText('1 Nov 2026')).toBeInTheDocument();
    expect(within(panel).getByText('Late')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Harbor Finance' })).toHaveAttribute('href', '/organizations/2');
    expect(within(panel).getByRole('link', { name: 'Ava Grant' })).toHaveAttribute('href', '/contacts/9');
    expect(screen.getByRole('region', { name: 'Timeline' })).toBeInTheDocument();
  });

  it('[REC-4] says when there is no close date or main contact', async () => {
    setup(deal({ id: 5, close_date: null, contact_id: null, contact_name: null }));
    await screen.findByRole('heading', { level: 1, name: 'Cloud migration' });
    expect(within(details()).getByText('None')).toBeInTheDocument();
    expect(within(details()).getByText('–')).toBeInTheDocument();
    expect(within(details()).queryByText('Late')).not.toBeInTheDocument();
    expect(within(details()).queryByText(/set by hand/)).not.toBeInTheDocument();
  });

  it('shows a plain message when the deal cannot be loaded', async () => {
    mockApi({
      'GET /deals/99': () => {
        throw new Error('Deal not found');
      },
    });
    renderWithApp(
      <Routes>
        <Route path="/deals/:id" element={<DealPage />} />
      </Routes>,
      { route: '/deals/99' },
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(await screen.findByRole('alert')).toHaveTextContent('Deal not found');
  });

  it('[REC-5] marks the current stage and moves the deal with one click', async () => {
    const moves: unknown[] = [];
    setup(deal({ id: 1, stage: 'proposal' }), {
      'PATCH /deals/1/move': (body: unknown) => {
        moves.push(body);
        return deal({ id: 1, stage: 'won' });
      },
    });
    const selector = await screen.findByRole('group', { name: 'Stage' });
    expect(within(selector).getByRole('button', { name: 'Proposal' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(selector).getByRole('button', { name: 'Proposal' })).toBeDisabled();
    await userEvent.click(within(selector).getByRole('button', { name: 'Won' }));
    expect(await screen.findByText('Moved to Won')).toBeInTheDocument();
    expect(moves).toEqual([{ stage: 'won' }]);
  });

  it('[REC-5] explains when the move fails', async () => {
    setup(deal({ id: 1, stage: 'proposal' }), {
      'PATCH /deals/1/move': () => {
        throw new Error('That deal was deleted.');
      },
    });
    const selector = await screen.findByRole('group', { name: 'Stage' });
    await userEvent.click(within(selector).getByRole('button', { name: 'Lost' }));
    expect(await screen.findByText('That deal was deleted.')).toBeInTheDocument();
  });

  it('[REC-1] opens the edit sheet with the deal filled in', async () => {
    setup(deal({ id: 1, name: 'Cloud migration' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('heading', { name: 'Edit deal' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Cloud migration');
  });

  it('[DEL-1] asks first, says the activities stay, then deletes and goes to the deals list', async () => {
    const fetchMock = setup(deal({ id: 1, name: 'Cloud migration' }), {
      'GET /deals/1/delete-impact': { activities: 2 },
      'DELETE /deals/1': null,
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Cloud migration?' });
    expect(
      await within(dialog).findByText(
        'Only the deal is deleted: its 2 activities stay as history and still show in recent activity.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('All deals')).toBeInTheDocument();
    expect(await screen.findByText('Deal deleted')).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/deals/1', expect.objectContaining({ method: 'DELETE' })),
    );
  });

  it('[DEL-1] says nothing else is linked when the deal has no activities', async () => {
    setup(deal({ id: 1 }), { 'GET /deals/1/delete-impact': { activities: 0 } });
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Nothing else is linked to it.')).toBeInTheDocument();
  });
});
