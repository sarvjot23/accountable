import { Link } from 'react-router';
import { money, monthName, moneyChange, percent, plural } from '../../lib/format';
import { Pill } from '../../ui/Pill';
import type { Dashboard } from './api';
import styles from './Dashboard.module.css';

function Meter({ share, color }: { share: number; color: string }) {
  return (
    <div className={styles.meter} aria-hidden>
      <i style={{ width: `${Math.max(0, Math.min(100, share))}%`, background: color }} />
    </div>
  );
}

/** The four big figures (DASH-3 to DASH-6), in one wide panel. */
export function FiguresStrip({ data }: { data: Dashboard }) {
  const won = data.won_this_month;
  const lastMonth = data.monthly.at(-2);
  return (
    <section className={styles.strip} aria-label="Key figures">
      <div className={styles.figure} data-testid="figure-open-pipeline">
        <p className={styles.label}>Open pipeline</p>
        <p className={styles.number}>{money(data.open_pipeline.value)}</p>
        <p className={styles.small}>{plural(data.open_pipeline.count, 'open deal')}</p>
        <Meter share={data.open_pipeline.value ? 100 : 0} color="var(--sea)" />
      </div>
      <div className={styles.figure} data-testid="figure-expected">
        <p className={styles.label}>Expected revenue</p>
        <p className={styles.number}>{money(data.expected_revenue.value)}</p>
        <p className={styles.small}>{percent(data.expected_revenue.share)} of the open pipeline</p>
        <Meter share={data.expected_revenue.share} color="var(--marigold)" />
      </div>
      <div className={styles.figure} data-testid="figure-won">
        <p className={styles.label}>Won this month</p>
        <p className={styles.number}>{money(won.value)}</p>
        <p className={styles.small}>
          <Pill tone={won.change >= 0 ? 'green' : 'red'}>{moneyChange(won.change)}</Pill> on{' '}
          {lastMonth ? monthName(lastMonth.month) : 'last month'}
        </p>
        <Meter share={won.share_of_best_month} color="var(--coral)" />
      </div>
      <Link to="/deals?late=1" className={`${styles.figure} ${styles.figureLink}`} data-testid="figure-late">
        <p className={styles.label}>Late deals</p>
        <p className={`${styles.number} ${styles.lateNumber}`}>{data.late_deals.count}</p>
        <p className={styles.small}>
          <Pill tone="red">{money(data.late_deals.value)}</Pill> past {data.late_deals.count === 1 ? 'its' : 'their'}{' '}
          close date
        </p>
        <Meter share={data.late_deals.share_of_open} color="var(--raspberry)" />
      </Link>
    </section>
  );
}
