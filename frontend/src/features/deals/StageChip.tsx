import { chipColor, stage } from '../../lib/stages';
import { Pill } from '../../ui/Pill';

/** A deal's stage as a chip in its stage color (TBL-11). */
export function StageChip({ stage: key }: { stage: string }) {
  const s = stage(key);
  return <Pill style={{ background: chipColor(key), color: s.textColor }}>{s.label}</Pill>;
}
