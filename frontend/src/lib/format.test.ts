// Money, dates, times and percentages (DASH-14, LOOK-6).
import {
  date,
  dateTime,
  initials,
  joinWords,
  longDate,
  money,
  moneyChange,
  moneyShort,
  monthName,
  percent,
  plural,
  shortDate,
  time,
} from './format';

describe('money (DASH-14, LOOK-6)', () => {
  it('always has US$ and separators', () => {
    expect(money(248500)).toBe('US$248,500');
    expect(money(0)).toBe('US$0');
    expect(money(1234567)).toBe('US$1,234,567');
    expect(money(-4000)).toBe('-US$4,000');
  });
  it('shows a change with its sign', () => {
    expect(moneyChange(52000)).toBe('+US$52,000');
    expect(moneyChange(-5000)).toBe('-US$5,000');
    expect(moneyChange(0)).toBe('US$0');
  });
  it('has a short form for chart axes, still with its currency', () => {
    expect(moneyShort(140000)).toBe('US$140k');
    expect(moneyShort(1500000)).toBe('US$1.5m');
    expect(moneyShort(0)).toBe('US$0');
  });
});

describe('dates and times (LOOK-6)', () => {
  it('shows dates as "17 Nov 2026"', () => {
    expect(date('2026-11-17')).toBe('17 Nov 2026');
    expect(shortDate('2026-11-10')).toBe('10 Nov');
    expect(longDate('2026-11-17')).toBe('Tuesday 17 November 2026');
  });
  it('shows times as "2:30 pm"', () => {
    expect(time(new Date(2026, 10, 17, 14, 30))).toBe('2:30 pm');
    expect(time(new Date(2026, 10, 17, 9, 5))).toBe('9:05 am');
    expect(dateTime(new Date(2026, 10, 17, 14, 30))).toBe('17 Nov 2026, 2:30 pm');
  });
  it('names months', () => {
    expect(monthName('2026-08')).toBe('August');
    expect(monthName('2026-08', 'short')).toBe('Aug');
  });
});

describe('words', () => {
  it('shows percentages', () => {
    expect(percent(53)).toBe('53%');
    expect(percent(52.6)).toBe('53%');
  });
  it('counts things in plain English', () => {
    expect(plural(1, 'deal')).toBe('1 deal');
    expect(plural(3, 'deal')).toBe('3 deals');
    expect(plural(2, 'activity')).toBe('2 activities');
    expect(plural(1, 'activity')).toBe('1 activity');
    expect(joinWords(['3 contacts', '2 deals', '11 activities'])).toBe('3 contacts, 2 deals and 11 activities');
    expect(initials('Grace Liu')).toBe('GL');
    expect(initials(null)).toBe('–');
  });
});
