import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { cx } from '../../lib/cx';
import { money, percent, shortDate } from '../../lib/format';
import { barColor } from '../../lib/stages';
import type { Deal } from '../deals/api';
import { LateChip } from '../deals/LateChip';
import styles from './Pipeline.module.css';

/** A card's content (PIPE-5), with the late outline and pill (PIPE-6). */
export function CardBody({ deal }: { deal: Deal }) {
  return (
    <>
      <p className={styles.org}>{deal.organization_name}</p>
      <p className={styles.name}>{deal.name}</p>
      <p className={styles.value}>{money(deal.value)}</p>
      <div className={styles.prob}>
        <span className={styles.track} aria-hidden>
          <i style={{ width: `${deal.probability}%`, background: barColor(deal.stage) }} />
        </span>
        <span>{percent(deal.probability)}</span>
      </div>
      <div className={styles.foot}>
        <span className={styles.contact}>{deal.contact_name ?? 'No contact'}</span>
        {deal.is_late ? (
          <LateChip date={deal.close_date} />
        ) : (
          deal.close_date && <span className={styles.date}>{shortDate(deal.close_date)}</span>
        )}
      </div>
    </>
  );
}

/** A draggable card. Click or Enter opens the deal (PIPE-14); Space picks it up to move with the arrow keys (PIPE-10). */
export function DealCard({ deal }: { deal: Deal }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' && !isDragging) {
      navigate(`/deals/${deal.id}`);
      return;
    }
    listeners?.onKeyDown?.(event);
  }

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx(styles.card, deal.is_late && styles.late, isDragging && styles.placeholder)}
      data-testid="deal-card"
      data-deal-id={deal.id}
      {...attributes}
      {...listeners}
      aria-roledescription="Deal card. Press Space to pick it up and the arrow keys to move it, or Enter to open it."
      onKeyDown={onKeyDown}
      onClick={() => navigate(`/deals/${deal.id}`)}
    >
      <CardBody deal={deal} />
    </article>
  );
}
