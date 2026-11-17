import { shortDate } from '../../lib/format';
import { Pill } from '../../ui/Pill';

/** The Raspberry "Late" chip (TBL-13), or "Late · 10 Nov" on a card (PIPE-6). */
export function LateChip({ date }: { date?: string | null }) {
  return <Pill tone="red">{date ? `Late · ${shortDate(date)}` : 'Late'}</Pill>;
}
