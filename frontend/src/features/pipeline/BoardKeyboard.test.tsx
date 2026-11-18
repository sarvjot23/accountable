// Moving cards with the keyboard: pick up with Space, move with the arrows, drop with Space (PIPE-8 to PIPE-12).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { STAGES } from '../../lib/stages';
import { deal } from '../../test/fixtures';
import { mockApi, renderWithApp } from '../../test/render';
import type { Deal } from '../deals/api';
import { PipelinePage } from './PipelinePage';

/**
 * jsdom has no layout, so give the board one: columns side by side, cards stacked in them,
 * each column's card area as tall as its cards.
 * The lifted copy of a card starts where the held (focused) card is.
 */
function boardLayout(this: Element): DOMRect {
  const column = this.closest('section[data-stage]');
  if (!column) {
    const held = document.activeElement;
    const isHeldCard = held && held !== this && held.closest('section[data-stage]');
    return isHeldCard ? boardLayout.call(held) : new DOMRect(0, 0, 0, 0);
  }
  const left = STAGES.findIndex((s) => s.key === column.getAttribute('data-stage')) * 200;
  if (this === column) return new DOMRect(left, 0, 180, 800);
  const cards = [...column.querySelectorAll('[data-testid="deal-card"]')];
  const cardIndex = cards.indexOf(this);
  if (cardIndex >= 0) return new DOMRect(left + 10, 100 + cardIndex * 100, 160, 80);
  return new DOMRect(left, 100, 180, Math.max(cards.length, 1) * 100);
}

const deals: Deal[] = [
  deal({ id: 1, name: 'Cloud migration', stage: 'proposal', value: 10000, probability: 50, expected_revenue: 5000 }),
  deal({ id: 2, name: 'Data warehouse', stage: 'proposal', value: 20000, probability: 50, expected_revenue: 10000 }),
  deal({
    id: 3,
    name: 'Store analytics pilot',
    stage: 'negotiation',
    value: 40000,
    probability: 75,
    expected_revenue: 30000,
  }),
];

// By default the save never answers, so the board shows the move without a refresh replacing it.
const neverAnswers = () => new Promise(() => {});

function setup(save: (body: unknown) => unknown = neverAnswers) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(boardLayout);
  const moves: unknown[] = [];
  const move = (body: unknown) => {
    moves.push(body);
    return save(body);
  };
  mockApi({ 'GET /deals': deals, 'PATCH /deals/1/move': move, 'PATCH /deals/3/move': move });
  renderWithApp(<PipelinePage />);
  return moves;
}

const column = (name: string) => screen.getByRole('region', { name });
const cardNames = (name: string) =>
  within(column(name))
    .queryAllByTestId('deal-card')
    .map((card) => deals.find((d) => card.textContent?.includes(d.name))?.name);

async function pickUp(name: string) {
  const card = (await screen.findByText(name)).closest<HTMLElement>('[data-testid="deal-card"]')!;
  card.focus();
  await userEvent.keyboard(' ');
}

describe('Pipeline board, by keyboard', () => {
  it('[PIPE-8] [PIPE-10] [PIPE-16] moves a card to the next column with one save', async () => {
    const moves = setup();
    await pickUp('Cloud migration');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard(' ');
    expect(await screen.findByText('Cloud migration dropped in Negotiation.')).toBeInTheDocument();
    expect(cardNames('Negotiation')).toEqual(['Cloud migration', 'Store analytics pilot']);
    expect(cardNames('Proposal')).toEqual(['Data warehouse']);
    await waitFor(() => expect(moves).toEqual([{ stage: 'negotiation', before_id: null, after_id: 3 }]));
  });

  it('[PIPE-11] updates the column and board figures at once, with the new stage’s probability', async () => {
    setup();
    await pickUp('Cloud migration');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard(' ');
    expect(within(column('Negotiation')).getByLabelText('2 deals')).toBeInTheDocument();
    expect(screen.getByTestId('column-sub-negotiation')).toHaveTextContent('US$37,500 expected');
    expect(screen.getByTestId('pipeline-summary')).toHaveTextContent(
      'US$70,000 open across 3 deals · US$47,500 expected',
    );
  });

  it('[PIPE-9] moves a card lower in its own column', async () => {
    const moves = setup();
    await pickUp('Cloud migration');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
    expect(cardNames('Proposal')).toEqual(['Data warehouse', 'Cloud migration']);
    await waitFor(() => expect(moves).toEqual([{ stage: 'proposal', before_id: 2, after_id: null }]));
  });

  it('[PIPE-12] puts the card back and explains when the save fails', async () => {
    setup(() => {
      throw new Error('The board changed while you were moving that card.');
    });
    await pickUp('Cloud migration');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard(' ');
    expect(await screen.findByText(/That move wasn't saved, so the card went back\./)).toBeInTheDocument();
    expect(cardNames('Proposal')).toEqual(['Cloud migration', 'Data warehouse']);
    expect(cardNames('Negotiation')).toEqual(['Store analytics pilot']);
  });

  it('[PIPE-10] cancels with Escape, and dropping in place saves nothing', async () => {
    const moves = setup();
    await pickUp('Cloud migration');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Escape}');
    expect(await screen.findByText('Move cancelled. Cloud migration put back.')).toBeInTheDocument();
    expect(cardNames('Proposal')).toEqual(['Cloud migration', 'Data warehouse']);

    await pickUp('Cloud migration');
    await userEvent.keyboard(' ');
    expect(await screen.findByText('Cloud migration dropped in Proposal.')).toBeInTheDocument();
    expect(cardNames('Proposal')).toEqual(['Cloud migration', 'Data warehouse']);
    expect(moves).toEqual([]);
  });

  it('[PIPE-9] drops a card in Won without a place, as Won keeps its own order', async () => {
    const moves = setup();
    await pickUp('Store analytics pilot');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard(' ');
    expect(cardNames('Won')).toEqual(['Store analytics pilot']);
    await waitFor(() => expect(moves).toEqual([{ stage: 'won', before_id: null, after_id: null }]));
  });

  it('[PIPE-10] does not move past the last column', async () => {
    setup();
    await pickUp('Cloud migration');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(await screen.findByText('Cloud migration is over Lost.')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  });
});
