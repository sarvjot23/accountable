// Stage labels, colors and order (DATA-7), and the chart series order (LOOK-4).
// They mirror backend/accountable/deals/stages.py; a test checks the two agree.

export type StageKey = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Stage {
  key: StageKey;
  label: string;
  probability: number;
  open: boolean;
  color: string;
  textColor: string;
}

export const STAGES: readonly Stage[] = [
  { key: 'new', label: 'New', probability: 10, open: true, color: '#06D6A0', textColor: '#073B4C' },
  { key: 'qualified', label: 'Qualified', probability: 25, open: true, color: '#FFC145', textColor: '#073B4C' },
  { key: 'proposal', label: 'Proposal', probability: 50, open: true, color: '#F78C6B', textColor: '#073B4C' },
  { key: 'negotiation', label: 'Negotiation', probability: 75, open: true, color: '#118AB2', textColor: '#FFFFFF' },
  { key: 'won', label: 'Won', probability: 100, open: false, color: '#073B4C', textColor: '#FFFFFF' },
  { key: 'lost', label: 'Lost', probability: 0, open: false, color: '#CDD8DB', textColor: '#073B4C' },
];

export const OPEN_STAGES = STAGES.filter((s) => s.open).map((s) => s.key);

export function stage(key: string): Stage {
  const found = STAGES.find((s) => s.key === key);
  if (!found) throw new Error(`Unknown stage: ${key}`);
  return found;
}

export const isOpen = (key: string) => stage(key).open;

/** The brand's order for things side by side: Sea Green, Marigold, Coral, Cerulean, Raspberry. */
export const SERIES = ['#06D6A0', '#FFC145', '#F78C6B', '#118AB2', '#EF476F'] as const;

/**
 * A chip's background for a stage. White on Cerulean is 4.0:1, short of WCAG AA for small
 * text (LOOK-8), so Negotiation's chips use a slightly deeper Cerulean; charts keep the brand color.
 */
export function chipColor(key: string): string {
  return key === 'negotiation' ? '#0E7DA2' : stage(key).color;
}

/** A probability bar's fill: the stage color, with Lost's pale Sea Mist darkened so it shows. */
export function barColor(key: string): string {
  return key === 'lost' ? '#9FB6BD' : stage(key).color;
}
