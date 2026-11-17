import { cx } from '../lib/cx';
import styles from './Chips.module.css';

/** A row of filter chips; the chosen one is a Midnight pill (TBL-10, TBL-12, PIPE-2). */
export function Chips<V extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: Array<{ value: V; label: string; count?: number }>;
}) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={cx(styles.chip, option.value === value && styles.on)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className={styles.count}>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A single on/off chip, such as "Late only". */
export function ToggleChip({ pressed, onChange, children }: { pressed: boolean; onChange: (v: boolean) => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(styles.chip, styles.toggle, pressed && styles.late)}
      onClick={() => onChange(!pressed)}
    >
      {children}
    </button>
  );
}
