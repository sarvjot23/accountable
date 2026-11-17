import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './Record.module.css';

/** A record page's header panel: its main fields, with Edit and Delete (REC-1). */
export function RecordHeader({
  kind,
  title,
  chips,
  facts,
  onEdit,
  onDelete,
  children,
}: {
  kind: string;
  title: string;
  chips?: ReactNode;
  facts?: Array<{ label: string; value: ReactNode }>;
  onEdit: () => void;
  onDelete: () => void;
  children?: ReactNode;
}) {
  return (
    <section className={styles.header} aria-label={`${kind} details`}>
      <div className={styles.top}>
        <div className={styles.titles}>
          <p className={styles.kind}>{kind}</p>
          <h1 className={styles.title}>{title}</h1>
          {chips && <div className={styles.chips}>{chips}</div>}
        </div>
        <div className={styles.actions}>
          <Button variant="light" className={styles.soft} onClick={onEdit}>
            <Pencil aria-hidden /> Edit
          </Button>
          <Button variant="light" className={styles.delete} onClick={onDelete}>
            <Trash2 aria-hidden /> Delete
          </Button>
        </div>
      </div>
      {facts && facts.length > 0 && (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}

/** The two columns under a record's header. */
export function RecordColumns({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className={styles.columns}>
      <div className={styles.column}>{left}</div>
      <div className={styles.column}>{right}</div>
    </div>
  );
}

/** A small table of linked records inside a panel. */
export function MiniTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <table className={styles.mini}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h || i} className={i === head.length - 1 && h ? styles.right : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export const recordStyles = styles;
