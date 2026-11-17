import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

/** The header row of every page: title in Instrument Serif at 44px, a one-line summary, and pill actions (LAY-4). */
export function PageHeader({
  title,
  summary,
  actions,
}: {
  title: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {summary && <p className={styles.summary}>{summary}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
