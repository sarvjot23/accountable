import { Link } from 'react-router';
import { initials, shortDate } from '../../lib/format';
import { EmptyState } from '../../ui/EmptyState';
import type { Dashboard } from './api';
import styles from './Dashboard.module.css';

const TINTS = ['#DCF8EF', '#FFF3DA', '#FEEBE4', '#E3F1F7'];
const tint = (key: number) => TINTS[key % TINTS.length];

/** DASH-13: the 15 newest activities of every type, linked or not. */
export function RecentActivity({ activities }: { activities: Dashboard['recent_activity'] }) {
  if (activities.length === 0) {
    return <EmptyState message="Nothing yet. Activities you log, and stage changes, show up here." />;
  }
  return (
    <ul className={`${styles.rows} ${styles.scrolling}`} aria-label="Recent activity" tabIndex={0}>
      {activities.map((a) => (
        <li key={a.id} className={styles.row} data-testid="recent-activity">
          <span className={styles.avatar} style={{ background: tint(a.contact_id ?? a.deal_id ?? a.id) }} aria-hidden>
            {initials(a.contact_name ?? a.deal_name)}
          </span>
          <div className={styles.rowText}>
            <p className={styles.rowTitle}>{a.description}</p>
            <p className={styles.rowSub}>
              {a.organization_id ? (
                <Link to={`/organizations/${a.organization_id}`}>{a.organization_name}</Link>
              ) : (
                'No longer linked'
              )}
            </p>
          </div>
          <span className={styles.rowDate}>{shortDate(a.occurred_at)}</span>
        </li>
      ))}
    </ul>
  );
}
