// The Pipeline board as the user sees it: columns, cards, adding and opening deals (PIPE-2 to PIPE-6, PIPE-13, PIPE-14).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { deal } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Deal } from '../deals/api';
import { PipelinePage } from './PipelinePage';

const wonDeal = (id: number, close_date: string) =>
  deal({ id, name: `Won deal ${id}`, stage: 'won', value: 1000, probability: 100, expected_revenue: 1000, close_date });

const deals: Deal[] = [
  deal({
    id: 1,
    name: 'Store analytics pilot',
    organization_name: 'Bluepeak Retail',
    stage: 'new',
    value: 24000,
    probability: 10,
    expected_revenue: 2400,
    contact_name: 'Ava Grant',
    close_date: '2026-11-10',
    is_late: true,
  }),
  deal({ id: 2, name: 'Cloud migration', stage: 'proposal', value: 180000, probability: 50, expected_revenue: 90000 }),
  wonDeal(11, '2026-11-01'),
  wonDeal(12, '2026-10-01'),
  wonDeal(13, '2026-09-01'),
  wonDeal(14, '2026-08-01'),
  wonDeal(15, '2026-07-01'),
  wonDeal(16, '2026-06-01'),
];

function DealPageStub() {
  return <p>Deal page {useParams().id}</p>;
}

async function setup(data: Deal[] = deals) {
  mockApi({ 'GET /deals': data, 'GET /organizations': [], 'GET /contacts': [] });
  renderWithApp(
    <Routes>
      <Route path="/pipeline" element={<PipelinePage />} />
      <Route path="/deals/:id" element={<DealPageStub />} />
    </Routes>,
    { route: '/pipeline' },
  );
  await screen.findAllByTestId('deal-card');
}

const column = (name: string) => screen.getByRole('region', { name });
const card = (name: string) => screen.getByText(name).closest<HTMLElement>('[data-testid="deal-card"]')!;

describe('Pipeline board', () => {
  it('[PIPE-3] shows six columns with their count, total value and expected revenue', async () => {
    await setup();
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual(['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']);
    const proposal = column('Proposal');
    expect(within(proposal).getByLabelText('1 deal')).toHaveTextContent('1');
    expect(screen.getByTestId('column-value-proposal')).toHaveTextContent('US$180,000');
    expect(within(proposal).getByText('US$90,000 expected')).toBeInTheDocument();
    expect(within(column('Qualified')).getByText('No deals here')).toBeInTheDocument();
  });

  it('[PIPE-4] shows the closed columns’ 12-month total and hides older closed deals behind "N more"', async () => {
    await setup();
    const won = column('Won');
    expect(within(won).getByText('Closed, last 12 months')).toBeInTheDocument();
    expect(screen.getByTestId('column-value-won')).toHaveTextContent('US$6,000');
    expect(within(won).getAllByTestId('deal-card')).toHaveLength(4);
    await userEvent.click(within(won).getByRole('button', { name: '2 more won deals' }));
    expect(within(won).getAllByTestId('deal-card')).toHaveLength(6);
    expect(within(won).queryByRole('button', { name: /more won/ })).not.toBeInTheDocument();
  });

  it('[PIPE-4] says "1 more lost deal" for a single hidden card', async () => {
    const lost = [1, 2, 3, 4, 5].map((id) =>
      deal({ id, name: `Lost ${id}`, stage: 'lost', close_date: `2026-0${id}-01` }),
    );
    await setup(lost);
    expect(within(column('Lost')).getByRole('button', { name: '1 more lost deal' })).toBeInTheDocument();
  });

  it('[PIPE-2] hides Won and Lost with "Open only"', async () => {
    await setup();
    const view = screen.getByRole('group', { name: 'Columns' });
    expect(within(view).getByRole('button', { name: 'All stages' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(view).getByRole('button', { name: 'Open only' }));
    expect(screen.queryByRole('region', { name: 'Won' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Lost' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
  });

  it('[PIPE-5] [PIPE-6] shows each card’s organization, name, value, probability, contact and date, and marks late cards', async () => {
    await setup();
    const late = card('Store analytics pilot');
    expect(late).toHaveTextContent('Bluepeak Retail');
    expect(late).toHaveTextContent('US$24,000');
    expect(late).toHaveTextContent('10%');
    expect(late).toHaveTextContent('Ava Grant');
    expect(within(late).getByText('Late · 10 Nov')).toBeInTheDocument();

    const onTime = card('Cloud migration');
    expect(onTime).toHaveTextContent('No contact');
    expect(within(onTime).getByText('1 Dec')).toBeInTheDocument();
    expect(within(onTime).queryByText(/Late/)).not.toBeInTheDocument();
  });

  it('[PIPE-13] opens the Add deal sheet with the column’s stage set', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add deal in Negotiation' }));
    expect(await screen.findByRole('heading', { name: 'Add deal' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Stage' })).toHaveTextContent('Negotiation');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Add deal' })).not.toBeInTheDocument();
  });

  it('[PIPE-2] opens the Add deal sheet in New from the header', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add deal' }));
    expect(await screen.findByRole('combobox', { name: 'Stage' })).toHaveTextContent('New');
  });

  it('[PIPE-14] opens the deal’s page when a card is clicked', async () => {
    await setup();
    await userEvent.click(card('Cloud migration'));
    expect(await screen.findByText('Deal page 2')).toBeInTheDocument();
  });

  it('[PIPE-14] opens the deal’s page with Enter', async () => {
    await setup();
    card('Cloud migration').focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Deal page 2')).toBeInTheDocument();
  });
});
