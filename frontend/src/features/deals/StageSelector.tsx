import { errorMessage } from '../../lib/api';
import { chipColor, STAGES } from '../../lib/stages';
import { useToast } from '../../ui/Toast';
import { useMoveDeal, type Deal } from './api';
import styles from './Deals.module.css';

/** The deal page's stage selector: moves the deal by RULE-3, the same call as the board (REC-5). */
export function StageSelector({ deal }: { deal: Deal }) {
  const move = useMoveDeal();
  const toast = useToast();
  return (
    <div className={styles.selector} role="group" aria-label="Stage">
      <span className={styles.selectorLabel}>Stage</span>
      {STAGES.map((s) => {
        const current = s.key === deal.stage;
        return (
          <button
            key={s.key}
            type="button"
            className={styles.stageButton}
            aria-pressed={current}
            disabled={current || move.isPending}
            style={current ? { background: chipColor(s.key), color: s.textColor } : undefined}
            onClick={() =>
              move.mutate(
                { id: deal.id, move: { stage: s.key } },
                {
                  onSuccess: () => toast(`Moved to ${s.label}`),
                  onError: (e) => toast(errorMessage(e), 'error'),
                },
              )
            }
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
