import { useId, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './Panel.module.css';

/** A white panel with 20px corners, no outline and no shadow (LAY-5, LOOK-5). */
export function Panel({
  title,
  sub,
  actions,
  children,
  className,
  flush = false,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  const id = useId();
  return (
    <section className={cx(styles.panel, flush && styles.flush, className)} aria-labelledby={title ? id : undefined}>
      {(title || actions) && (
        <div className={styles.head}>
          <div>
            {title && (
              <h2 id={id} className={styles.title}>
                {title}
              </h2>
            )}
            {sub && <p className={styles.sub}>{sub}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
