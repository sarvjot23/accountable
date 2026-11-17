import { ArrowRightLeft, Mail, Phone, Plus, StickyNote } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { Link } from 'react-router';
import { cx } from '../../lib/cx';
import { date, dateTime } from '../../lib/format';
import { Button } from '../../ui/Button';
import { ConfirmDelete } from '../../ui/ConfirmDelete';
import { EmptyState } from '../../ui/EmptyState';
import { Panel } from '../../ui/Panel';
import { PageState } from '../../ui/PageState';
import { RowMenu } from '../../ui/RowMenu';
import { useToast } from '../../ui/Toast';
import { TYPE_LABELS, useDeleteActivity, useTimeline, type Activity, type ActivityType, type TimelineKind } from './api';
import { ActivitySheet, type ActivityPreset } from './ActivityForm';
import styles from './Activities.module.css';
import { DoneCheck } from './DoneCheck';

export const TYPE_ICONS: Record<ActivityType, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  stage_change: ArrowRightLeft,
};

/** A contact's or deal's timeline, newest first, with Log activity (REC-6 to REC-9). */
export function Timeline({ kind, id, preset }: { kind: TimelineKind; id: number; preset: ActivityPreset }) {
  const query = useTimeline(kind, id);
  const [editing, setEditing] = useState<Activity | null | undefined>(undefined); // null = logging a new one
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const remove = useDeleteActivity();
  const toast = useToast();
  const entries = query.data ?? [];

  return (
    <Panel
      title="Timeline"
      sub="Newest first"
      actions={
        <Button variant="primary" size="small" onClick={() => setEditing(null)}>
          <Plus aria-hidden /> Log activity
        </Button>
      }
    >
      <PageState query={query}>
        {entries.length === 0 ? (
          <EmptyState message="Nothing logged yet. Log a call, an email or a note to start the history." />
        ) : (
          <ol className={styles.list} aria-label="Timeline">
            {entries.map((entry) => (
              <TimelineEntry
                key={entry.id}
                entry={entry}
                kind={kind}
                onEdit={() => setEditing(entry)}
                onDelete={() => setDeleting(entry)}
              />
            ))}
          </ol>
        )}
      </PageState>
      <ActivitySheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        activity={editing ?? undefined}
        preset={preset}
      />
      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        name={deleting?.type === 'stage_change' ? 'this stage change' : 'this activity'}
        consequences={
          deleting?.type === 'stage_change'
            ? 'Only the entry is deleted. The deal stays in its current stage.'
            : 'Only this activity is deleted.'
        }
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          toast('Activity deleted');
        }}
      />
    </Panel>
  );
}

function TimelineEntry({
  entry,
  kind,
  onEdit,
  onDelete,
}: {
  entry: Activity;
  kind: TimelineKind;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[entry.type];
  return (
    <li className={styles.entry} data-testid="timeline-entry">
      <span className={cx(styles.icon, styles[entry.type])} title={TYPE_LABELS[entry.type]}>
        <Icon aria-hidden />
        <span className="visually-hidden">{TYPE_LABELS[entry.type]}</span>
      </span>
      <div className={styles.body}>
        <p className={styles.description}>{entry.description}</p>
        <p className={styles.meta}>
          <span className={styles.when}>{dateTime(entry.occurred_at)}</span>
          {/* The other linked record: the deal on a contact's timeline, the contact on a deal's. */}
          {kind === 'contacts' && entry.deal_id && <Link to={`/deals/${entry.deal_id}`}>{entry.deal_name}</Link>}
          {kind === 'deals' && entry.contact_id && <Link to={`/contacts/${entry.contact_id}`}>{entry.contact_name}</Link>}
        </p>
        {entry.follow_up_date && (
          <div className={styles.followUp}>
            <DoneCheck activity={entry} />
            <span className={cx(entry.follow_up_done && styles.doneText, entry.follow_up_status === 'overdue' && styles.overdue)}>
              Follow up <span className={styles.followUpDate}>{date(entry.follow_up_date)}</span>
              {entry.follow_up_status === 'overdue' && ' · overdue'}
              {entry.follow_up_status === 'today' && ' · today'}
            </span>
          </div>
        )}
      </div>
      <RowMenu label={entry.description} onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}
