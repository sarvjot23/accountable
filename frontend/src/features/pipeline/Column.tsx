import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { money, plural } from '../../lib/format';
import { chipColor, stage as stageOf, type StageKey } from '../../lib/stages';
import type { Deal } from '../deals/api';
import { columnTotals } from './boardTotals';
import { DealCard } from './DealCard';
import styles from './Pipeline.module.css';

const CLOSED_SHOWN = 4;

/** One stage column: its header panel (PIPE-3, PIPE-4), its cards, and "+" to add a deal there (PIPE-13). */
export function Column({ stageKey, deals, onAdd }: { stageKey: StageKey; deals: Deal[]; onAdd: (stage: StageKey) => void }) {
  const s = stageOf(stageKey);
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  const [showAll, setShowAll] = useState(false);
  const totals = columnTotals(deals);
  const hidden = !s.open && !showAll ? Math.max(0, deals.length - CLOSED_SHOWN) : 0;
  const shown = hidden ? deals.slice(0, CLOSED_SHOWN) : deals;
  const headingId = `column-${stageKey}`;

  return (
    <section className={styles.column} aria-labelledby={headingId} data-stage={stageKey}>
      <header className={styles.colHead}>
        <div className={styles.colTop}>
          <h2 id={headingId} className={styles.stagePill} style={{ background: chipColor(stageKey), color: s.textColor }}>
            {s.label}
          </h2>
          <span className={styles.count} aria-label={plural(totals.count, 'deal')}>
            {totals.count}
          </span>
        </div>
        <p className={styles.colValue} data-testid={`column-value-${stageKey}`}>
          {money(totals.value)}
        </p>
        <p className={styles.colSub} data-testid={`column-sub-${stageKey}`}>
          {s.open ? `${money(totals.expected)} expected` : 'Closed, last 12 months'}
        </p>
      </header>
      <SortableContext id={stageKey} items={shown.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={styles.cards} data-over={isOver || undefined}>
          {shown.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
          {deals.length === 0 && <p className={styles.emptyCol}>No deals here</p>}
        </div>
      </SortableContext>
      {hidden > 0 && (
        <button type="button" className={styles.more} onClick={() => setShowAll(true)}>
          {hidden} more {s.key === 'won' ? 'won' : 'lost'} {hidden === 1 ? 'deal' : 'deals'}
        </button>
      )}
      <button type="button" className={styles.add} onClick={() => onAdd(stageKey)} aria-label={`Add deal in ${s.label}`}>
        <Plus aria-hidden /> Add deal
      </button>
    </section>
  );
}
