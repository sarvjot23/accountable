import { Pill } from '../../ui/Pill';
import { STATUSES, type ContactStatus } from './api';

/** A contact's status as a colored chip (TBL-9). */
export function StatusChip({ status }: { status: ContactStatus }) {
  const s = STATUSES.find((x) => x.key === status)!;
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
