import { Check } from 'lucide-react';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { useToast } from '../../ui/Toast';
import { useMarkDone, type Activity } from './api';
import styles from './Activities.module.css';

/** The round Done checkbox on a follow-up, on the dashboard and on timelines (DASH-12, REC-9). */
export function DoneCheck({ activity }: { activity: Pick<Activity, 'id' | 'description' | 'follow_up_done' | 'follow_up_status'> }) {
  const markDone = useMarkDone();
  const toast = useToast();
  const done = activity.follow_up_done;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`Done: ${activity.description}`}
      disabled={markDone.isPending}
      className={cx(styles.check, activity.follow_up_status === 'overdue' && styles.overdueCheck, done && styles.checked)}
      onClick={(e) => {
        e.stopPropagation();
        markDone.mutate(
          { id: activity.id, done: !done },
          {
            onSuccess: () => toast(done ? 'Follow-up opened again' : 'Follow-up done'),
            onError: (error) => toast(errorMessage(error), 'error'),
          },
        );
      }}
    >
      {done && <Check aria-hidden />}
    </button>
  );
}
