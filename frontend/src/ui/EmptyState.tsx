import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

/** What to show when there's nothing yet: a short message saying what to do next (DASH-15, TBL-7). */
export function EmptyState({ message, action }: { message: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.empty} role="status">
      <p>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
