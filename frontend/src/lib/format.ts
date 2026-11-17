// Money, dates, times and percentages, in the brand's words (LOOK-6, DASH-14).
import { format, parseISO } from 'date-fns';

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** "US$12,500". Money always carries its currency. */
export function money(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}US$${whole.format(Math.abs(Math.round(value)))}`;
}

/** "+US$52,000" or "-US$4,000" for a change. */
export function moneyChange(value: number): string {
  return value > 0 ? `+${money(value)}` : money(value);
}

/** "US$140k" for chart axes. */
export function moneyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `US$${+(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1_000) return `US$${+(value / 1_000).toFixed(0)}k`;
  return money(value);
}

const toDate = (value: string | Date) => (typeof value === 'string' ? parseISO(value) : value);

/** "17 Nov 2026" */
export function date(value: string | Date): string {
  return format(toDate(value), 'd MMM yyyy');
}

/** "17 Nov" */
export function shortDate(value: string | Date): string {
  return format(toDate(value), 'd MMM');
}

/** "2:30 pm" */
export function time(value: string | Date): string {
  return format(toDate(value), 'h:mm a').toLowerCase();
}

/** "17 Nov 2026, 2:30 pm" */
export function dateTime(value: string | Date): string {
  return `${date(value)}, ${time(value)}`;
}

/** "Tuesday 17 November 2026" */
export function longDate(value: string | Date): string {
  return format(toDate(value), 'EEEE d MMMM yyyy');
}

/** "2026-11" to "November" (long) or "Nov" (short). */
export function monthName(month: string, style: 'long' | 'short' = 'long'): string {
  return format(parseISO(`${month}-01`), style === 'long' ? 'MMMM' : 'MMM');
}

/** "53%" */
export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

/** "1 deal", "3 deals", "1 activity", "2 activities". */
export function plural(count: number, one: string, many?: string): string {
  const word = count === 1 ? one : (many ?? (one.endsWith('y') ? `${one.slice(0, -1)}ies` : `${one}s`));
  return `${count} ${word}`;
}

/** "a", "a and b", "a, b and c". */
export function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** "GL" for Grace Liu. */
export function initials(name: string | null | undefined): string {
  if (!name) return '–';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** A date input's value ("2026-11-17") for today in local time. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
