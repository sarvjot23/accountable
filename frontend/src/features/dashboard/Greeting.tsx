import { longDate, money, plural } from '../../lib/format';
import type { Dashboard } from './api';
import styles from './Dashboard.module.css';

export function partOfDay(now: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/** "2 follow-ups overdue, 2 deals running late", or a calm line when there's nothing to chase. */
export function summaryLine(data: Pick<Dashboard, 'follow_ups' | 'late_deals'>): string {
  const parts: string[] = [];
  if (data.follow_ups.overdue) parts.push(`${plural(data.follow_ups.overdue, 'follow-up')} overdue`);
  if (data.follow_ups.due_today) parts.push(`${plural(data.follow_ups.due_today, 'follow-up')} due today`);
  if (data.late_deals.count) parts.push(`${plural(data.late_deals.count, 'deal')} running late`);
  return parts.length ? parts.join(', ') : 'Nothing overdue and no deals running late';
}

/** DASH-2: "Good morning. US$92,000 won so far this month.", the date and a plain summary. */
export function Greeting({ data, now = new Date() }: { data: Dashboard; now?: Date }) {
  return (
    <div className={styles.greeting}>
      <h1 className={styles.hello}>
        Good {partOfDay(now)}. <em>{money(data.won_this_month.value)}</em> won so far this month.
      </h1>
      <p className={styles.today}>
        {longDate(data.today)} · {summaryLine(data)}
      </p>
    </div>
  );
}
