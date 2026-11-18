// A failed save puts the card back and explains (PIPE-12).
import { act, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { deal } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import { applyMove, boardTotals, type Columns } from './boardTotals';
import { PipelinePage, useBoard } from './PipelinePage';

const deals = [
  deal({ id: 1, name: 'Store analytics pilot', stage: 'new', value: 24000, probability: 10, expected_revenue: 2400 }),
  deal({ id: 2, name: 'Cloud migration', stage: 'proposal', value: 180000, probability: 50, expected_revenue: 90000 }),
];

let board: ReturnType<typeof useBoard>;
function Harness() {
  const current = useBoard(deals);
  useEffect(() => {
    board = current;
  });
  const totals = boardTotals(current.columns);
  return (
    <p data-testid="state">
      new:{current.columns.new.map((d) => d.id).join()} negotiation:
      {current.columns.negotiation.map((d) => d.id).join()} expected:
      {totals.expected}
    </p>
  );
}

describe('PipelinePage (PIPE-12)', () => {
  it('puts the card back and shows a message when the save fails', async () => {
    mockApi({
      'PATCH /deals/1/move': () => {
        throw new Error('The board changed while you were moving that card. Refresh and try again.');
      },
    });
    renderWithApp(<Harness />);
    expect(screen.getByTestId('state')).toHaveTextContent('new:1 negotiation: expected:92400');

    const before = board.columns;
    const moved = applyMove(before.new[0]!, 'negotiation', board.today);
    const next: Columns = { ...before, new: [], negotiation: [moved] };
    await act(() => board.commit(1, before, next));

    expect(screen.getByTestId('state')).toHaveTextContent('new:1 negotiation: expected:92400');
    expect(
      await screen.findByText(/That move wasn't saved, so the card went back\. The board changed/),
    ).toBeInTheDocument();
  });

  it('shows the move at once while the save is in flight', async () => {
    let release!: () => void;
    const saving = new Promise<void>((r) => (release = r));
    mockApi({ 'PATCH /deals/1/move': async () => (await saving, deals[0]), 'GET /deals': deals });
    renderWithApp(<Harness />);
    const before = board.columns;
    const next: Columns = { ...before, new: [], negotiation: [applyMove(before.new[0]!, 'negotiation', board.today)] };
    let done!: Promise<void>;
    act(() => {
      done = board.commit(1, before, next);
    });
    expect(screen.getByTestId('state')).toHaveTextContent('new: negotiation:1 expected:108000');
    release();
    await act(() => done);
  });

  it('renders the board from the deals', async () => {
    mockApi({ 'GET /deals': deals });
    renderWithApp(<PipelinePage />);
    await waitFor(() => expect(screen.getAllByTestId('deal-card')).toHaveLength(2));
    expect(screen.getByTestId('pipeline-summary')).toHaveTextContent(
      'US$204,000 open across 2 deals · US$92,400 expected',
    );
  });
});
