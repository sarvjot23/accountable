// The board's instant figures (PIPE-11). This is the one place the frontend works out a
// rule itself (RULE-16): while a move is saving, the moved card takes its new stage's
// probability (RULE-3) so every total is right at once. The board refetches after the save.
import { addMonths, format, parseISO, startOfMonth } from 'date-fns';
import { OPEN_STAGES, STAGES, stage, type StageKey } from '../../lib/stages';
import type { Deal } from '../deals/api';

export type Columns = Record<StageKey, Deal[]>;

const expected = (value: number, probability: number) => Math.floor((value * probability + 50) / 100);

/** RULE-3 as the board shows it before the save returns. */
export function applyMove(deal: Deal, to: StageKey, today: string): Deal {
  if (deal.stage === to) return deal;
  const target = stage(to);
  const closeDate = !target.open && !deal.close_date_manual ? today : deal.close_date;
  return {
    ...deal,
    stage: to,
    probability: target.probability,
    probability_manual: false,
    expected_revenue: expected(deal.value, target.probability),
    close_date: closeDate,
    is_late: target.open && closeDate !== null && closeDate < today,
  };
}

/** The first day of the 12 months that end with this month, as "YYYY-MM-DD". */
export function windowStart(today: string): string {
  return format(addMonths(startOfMonth(parseISO(today)), -11), 'yyyy-MM-dd');
}

/** Cards per column: open stages in board order, Won and Lost closed in the last 12 months, most recent first. */
export function toColumns(deals: Deal[], today: string): Columns {
  const start = windowStart(today);
  const columns = Object.fromEntries(STAGES.map((s) => [s.key, [] as Deal[]])) as Columns;
  for (const deal of [...deals].sort((a, b) => a.position - b.position || a.id - b.id)) {
    if (!stage(deal.stage).open && (deal.close_date === null || deal.close_date < start)) continue;
    columns[deal.stage].push(deal);
  }
  columns.won = sortClosed(columns.won);
  columns.lost = sortClosed(columns.lost);
  return columns;
}

export function sortClosed(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => (b.close_date ?? '').localeCompare(a.close_date ?? '') || b.id - a.id);
}

export interface ColumnTotals {
  count: number;
  value: number;
  expected: number;
}

export function columnTotals(deals: Deal[]): ColumnTotals {
  return {
    count: deals.length,
    value: deals.reduce((sum, d) => sum + d.value, 0),
    expected: deals.reduce((sum, d) => sum + d.expected_revenue, 0),
  };
}

/** RULE-2 on the board: the open stages only. */
export function boardTotals(columns: Columns): ColumnTotals {
  return columnTotals(OPEN_STAGES.flatMap((key) => columns[key]));
}
