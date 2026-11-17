// The greeting (DASH-2).
import { render, screen } from '@testing-library/react';
import type { Dashboard } from './api';
import { Greeting, partOfDay, summaryLine } from './Greeting';

const data = {
  today: '2026-11-17',
  won_this_month: { value: 92000, count: 1, last_month_value: 40000, change: 52000, share_of_best_month: 77 },
  follow_ups: { overdue: 2, due_today: 0, upcoming: 3, items: [] },
  late_deals: { count: 2, value: 330000, share_of_open: 47 },
} as unknown as Dashboard;

describe('Greeting (DASH-2)', () => {
  it('says morning, afternoon or evening', () => {
    expect(partOfDay(new Date(2026, 10, 17, 8))).toBe('morning');
    expect(partOfDay(new Date(2026, 10, 17, 11, 59))).toBe('morning');
    expect(partOfDay(new Date(2026, 10, 17, 12))).toBe('afternoon');
    expect(partOfDay(new Date(2026, 10, 17, 18))).toBe('evening');
  });

  it('gives revenue won this month in the heading, and the date with a plain summary', () => {
    render(<Greeting data={data} now={new Date(2026, 10, 17, 9)} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning. US$92,000 won so far this month.');
    expect(screen.getByText('US$92,000').tagName).toBe('EM');
    expect(screen.getByText('Tuesday 17 November 2026 · 2 follow-ups overdue, 2 deals running late')).toBeInTheDocument();
  });

  it('keeps the summary line plain in every case', () => {
    const calm = { ...data, follow_ups: { ...data.follow_ups, overdue: 0 }, late_deals: { ...data.late_deals, count: 0 } };
    expect(summaryLine(calm)).toBe('Nothing overdue and no deals running late');
    const one = { ...data, follow_ups: { ...data.follow_ups, overdue: 1, due_today: 1 }, late_deals: { ...data.late_deals, count: 1 } };
    expect(summaryLine(one)).toBe('1 follow-up overdue, 1 follow-up due today, 1 deal running late');
  });
});
