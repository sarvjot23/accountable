import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './Pill.module.css';

export type PillTone = 'green' | 'red' | 'amber' | 'blue' | 'neutral' | 'dark';

/** A small full pill for chips and status labels (LOOK-2). */
export function Pill({
  tone = 'neutral',
  children,
  className,
  style,
  title,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <span className={cx(styles.pill, styles[tone], className)} style={style} title={title}>
      {children}
    </span>
  );
}
