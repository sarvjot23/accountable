// Instant totals on the board (PIPE-11): the one rule the frontend works out itself (RULE-16).
import { deal } from '../../test/fixtures';
import { applyMove, boardTotals, columnTotals, toColumns, windowStart } from './boardTotals';

const TODAY = '2026-11-17';
const deals = [
  deal({ id: 1, stage: 'new', value: 24000, probability: 10, expected_revenue: 2400, position: 1 }),
  deal({ id: 2, stage: 'proposal', value: 180000, probability: 50, expected_revenue: 90000, position: 1 }),
  deal({ id: 3, stage: 'negotiation', value: 150000, probability: 75, expected_revenue: 112500, position: 1 }),
  deal({ id: 4, stage: 'won', value: 92000, probability: 100, expected_revenue: 92000, close_date: '2026-11-06' }),
  deal({ id: 5, stage: 'won', value: 30000, probability: 100, expected_revenue: 30000, close_date: '2025-10-01' }),
];

describe('board totals (PIPE-11, RULE-16)', () => {
  it('count only open stages on the board', () => {
    const columns = toColumns(deals, TODAY);
    expect(boardTotals(columns)).toEqual({ count: 3, value: 354000, expected: 2400 + 90000 + 112500 });
  });

  it('show only the last 12 months in Won and Lost', () => {
    expect(windowStart(TODAY)).toBe('2025-12-01');
    const columns = toColumns(deals, TODAY);
    expect(columns.won.map((d) => d.id)).toEqual([4]);
  });

  it('change at once when a card moves, before the save returns', () => {
    const before = toColumns(deals, TODAY);
    const moved = applyMove(before.proposal[0]!, 'negotiation', TODAY);
    const after = { ...before, proposal: [], negotiation: [...before.negotiation, moved] };
    expect(moved.probability).toBe(75);
    expect(moved.expected_revenue).toBe(135000);
    expect(columnTotals(after.negotiation)).toEqual({ count: 2, value: 330000, expected: 112500 + 135000 });
    expect(columnTotals(after.proposal)).toEqual({ count: 0, value: 0, expected: 0 });
    expect(boardTotals(after)).toEqual({ count: 3, value: 354000, expected: 2400 + 112500 + 135000 });
  });

  it('take a deal moved to Won out of the open totals and into Won, closed today', () => {
    const before = toColumns(deals, TODAY);
    const won = applyMove(before.negotiation[0]!, 'won', TODAY);
    expect(won).toMatchObject({ probability: 100, expected_revenue: 150000, close_date: TODAY, is_late: false });
    const after = { ...before, negotiation: [], won: [won, ...before.won] };
    expect(boardTotals(after).value).toBe(204000);
    expect(columnTotals(after.won).value).toBe(242000);
  });

  it('keep a close date set by hand', () => {
    const manual = deal({ close_date: '2026-11-02', close_date_manual: true });
    expect(applyMove(manual, 'lost', TODAY).close_date).toBe('2026-11-02');
  });

  it('agree with the backend’s rounding of expected revenue (RULE-1)', () => {
    expect(applyMove(deal({ value: 1005, stage: 'new' }), 'proposal', TODAY).expected_revenue).toBe(503);
  });
});
