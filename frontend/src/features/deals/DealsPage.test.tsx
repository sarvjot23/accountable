// The Deals table: its columns, filters, late deals and row actions (TBL-3, TBL-4, TBL-5, TBL-7, TBL-11 to TBL-13).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { deal } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Deal } from './api';
import { DealsPage } from './DealsPage';

const deals = [
  deal({
    id: 1,
    name: 'Cloud migration',
    stage: 'proposal',
    value: 180000,
    probability: 50,
    expected_revenue: 90000,
    close_date: '2026-11-01',
    is_late: true,
    contact_id: 9,
    contact_name: 'Ava Grant',
  }),
  deal({ id: 2, name: 'Store analytics pilot', stage: 'new', value: 24000, probability: 10, expected_revenue: 2400 }),
  deal({
    id: 3,
    name: 'Data warehouse',
    stage: 'won',
    value: 50000,
    probability: 100,
    expected_revenue: 50000,
    close_date: null,
  }),
];

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function setup(data: Deal[] = deals, route = '/deals') {
  mockApi({
    'GET /deals': data,
    'GET /organizations': [],
    'GET /contacts': [],
    'GET /deals/1/delete-impact': { activities: 0 },
  });
  renderWithApp(
    <>
      <Routes>
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/:id" element={<p>Deal page</p>} />
      </Routes>
      <Where />
    </>,
    { route },
  );
}

const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]!.textContent);

describe('DealsPage', () => {
  it('[TBL-11] lists each deal with its organization, contact, stage chip and figures, ordered by stage', async () => {
    setup();
    await screen.findByRole('link', { name: 'Cloud migration' });
    expect(rowNames()).toEqual(['Store analytics pilot', 'Cloud migration', 'Data warehouse']);
    const row = screen.getByRole('row', { name: /Cloud migration/ });
    expect(within(row).getByRole('link', { name: 'Northwind Labs' })).toHaveAttribute('href', '/organizations/1');
    expect(within(row).getByRole('link', { name: 'Ava Grant' })).toHaveAttribute('href', '/contacts/9');
    expect(within(row).getByText('Proposal')).toBeInTheDocument();
    expect(within(row).getByText('US$180,000')).toBeInTheDocument();
    expect(within(row).getByText('50%')).toBeInTheDocument();
    expect(within(row).getByText('US$90,000')).toBeInTheDocument();
  });

  it('[TBL-13] shows a Late chip beside a late deal’s close date, and a dash when there is no date', async () => {
    setup();
    const late = await screen.findByRole('row', { name: /Cloud migration/ });
    expect(within(late).getByText('1 Nov 2026')).toBeInTheDocument();
    expect(within(late).getByText('Late')).toBeInTheDocument();
    const undated = screen.getByRole('row', { name: /Data warehouse/ });
    expect(within(undated).getByText('–')).toBeInTheDocument();
    expect(within(undated).queryByText('Late')).not.toBeInTheDocument();
  });

  it('sums the open deals and counts the late ones in the header', async () => {
    setup();
    await screen.findByRole('link', { name: 'Cloud migration' });
    expect(screen.getByText(/open deals worth/).parentElement).toHaveTextContent(
      '2 open deals worth US$204,000 · 1 running late',
    );
  });

  it('[TBL-12] filters by stage and keeps the filter in the address', async () => {
    setup();
    await screen.findByRole('link', { name: 'Cloud migration' });
    const filter = screen.getByRole('group', { name: 'Filter by stage' });
    await userEvent.click(within(filter).getByRole('button', { name: 'Open' }));
    expect(rowNames()).toEqual(['Store analytics pilot', 'Cloud migration']);
    expect(screen.getByTestId('where')).toHaveTextContent('/deals?stage=open');

    await userEvent.click(within(filter).getByRole('button', { name: 'Won' }));
    expect(rowNames()).toEqual(['Data warehouse']);
    expect(within(filter).getByRole('button', { name: 'Won' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(within(filter).getByRole('button', { name: 'All' }));
    expect(rowNames()).toHaveLength(3);
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/deals$/);
  });

  it('[TBL-12] shows only late deals with the Late only toggle, read from the address too', async () => {
    setup(deals, '/deals?late=1');
    await screen.findByRole('link', { name: 'Cloud migration' });
    expect(screen.getByRole('button', { name: 'Late only' })).toHaveAttribute('aria-pressed', 'true');
    expect(rowNames()).toEqual(['Cloud migration']);
    await userEvent.click(screen.getByRole('button', { name: 'Late only' }));
    expect(rowNames()).toHaveLength(3);
  });

  it('says when nothing is late, and when a stage filter matches nothing', async () => {
    setup([deals[1]!]);
    await screen.findByRole('link', { name: 'Store analytics pilot' });
    await userEvent.click(screen.getByRole('button', { name: 'Late only' }));
    expect(screen.getByText('No deals are running late. Nice work.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Late only' }));
    await userEvent.click(screen.getByRole('button', { name: 'Lost' }));
    expect(screen.getByText('No deals match this filter.')).toBeInTheDocument();
  });

  it('[TBL-7] has an empty state with the Add button when there are no deals', async () => {
    setup([]);
    expect(await screen.findByText("No deals yet. Add the first sale you're working on.")).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add deal' })).toHaveLength(2);
  });

  it('[TBL-3] opens the Add deal sheet from the header', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Add deal' }));
    expect(await screen.findByRole('heading', { name: 'Add deal' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('heading', { name: 'Add deal' })).not.toBeInTheDocument();
  });

  it('[TBL-5] opens the deal’s page when the row is clicked', async () => {
    setup();
    await userEvent.click(await screen.findByText('US$24,000'));
    expect(await screen.findByText('Deal page')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/deals/2');
  });

  it('[TBL-4] edits and deletes from the row menu', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Cloud migration' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/ }));
    expect(await screen.findByRole('heading', { name: 'Edit deal' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Cloud migration');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Cloud migration' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Cloud migration?' });
    expect(await within(dialog).findByText('Nothing else is linked to it.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
