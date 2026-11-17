import { useState } from 'react';
import { Link } from 'react-router';
import { cx } from '../../lib/cx';
import { shortDate } from '../../lib/format';
import { EmptyState } from '../../ui/EmptyState';
import { DoneCheck } from '../activities/DoneCheck';
import type { Dashboard } from './api';
import styles from './Dashboard.module.css';

const SHOWN = 8;

/** DASH-11, DASH-12: open tasks, overdue first, then the next 14 days, each with Done. */
export function FollowUps({ followUps }: { followUps: Dashboard['follow_ups'] }) {
  const [all, setAll] = useState(false);
  const items = all ? followUps.items : followUps.items.slice(0, SHOWN);
  if (followUps.items.length === 0) {
    return <EmptyState message="No follow-ups due. Log an activity from a contact or deal." />;
  }
  return (
    <>
      <ul className={styles.rows} aria-label="Follow-ups">
        {items.map((item) => {
          const overdue = item.follow_up_status === 'overdue';
          const to = item.deal_id ? `/deals/${item.deal_id}` : item.contact_id ? `/contacts/${item.contact_id}` : null;
          const who = [item.contact_name, item.deal_name ?? item.organization_name].filter(Boolean).join(' · ');
          return (
            <li key={item.id} className={styles.row} data-testid="follow-up">
              <DoneCheck activity={item} />
              <div className={styles.rowText}>
                <p className={styles.rowTitle}>{item.description}</p>
                <p className={styles.rowSub}>{to ? <Link to={to}>{who || 'Open the record'}</Link> : 'No longer linked'}</p>
              </div>
              <span className={cx(styles.rowDate, overdue && styles.overdueDate)}>
                {item.follow_up_status === 'today' ? 'Today' : shortDate(item.follow_up_date!)}
              </span>
            </li>
          );
        })}
      </ul>
      {!all && followUps.items.length > SHOWN && (
        <button type="button" className={styles.showAll} onClick={() => setAll(true)}>
          Show all {followUps.items.length}
        </button>
      )}
    </>
  );
}
