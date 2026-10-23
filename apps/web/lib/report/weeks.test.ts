import { describe, expect, it } from 'vitest';
import type { DayEntry, MonthReport } from './types';
import {
  coveredWeeks,
  isoWeekNumber,
  latestFilledWeek,
  mondayOf,
  parseWeekSlug,
  storeDate,
  relativeChange,
  reportsForWeek,
  weekRange,
  weekRecap,
  weekSpan,
} from './weeks';

const day = (dayNumber: number, figures: Omit<DayEntry, 'day' | 'extras'> = {}): DayEntry => ({
  day: dayNumber,
  extras: {},
  ...figures,
});

// The week of the store's "Récap semaine 12/10-18/10": 13 899 € over six open days, Sunday closed
const OCTOBER: MonthReport = {
  month: { year: 2026, month: 10 },
  tabName: 'Octobre',
  monthlyObjective: 50000,
  extraColumns: ['Retours'],
  days: [
    // Week before (5 → 11): 18 532 €
    day(5, { revenue: 3000, tickets: 20, items: 30 }),
    day(6, { revenue: 3000, tickets: 20, items: 30 }),
    day(7, { revenue: 3000, tickets: 20, items: 30 }),
    day(8, { revenue: 3000, tickets: 20, items: 30 }),
    day(9, { revenue: 3000, tickets: 20, items: 30 }),
    day(10, { revenue: 3532, tickets: 20, items: 30, visitors: 40 }),
    day(11, {}),
    // Recap week (12 → 18)
    day(12, { revenue: 2500, objective: 2000, tickets: 18, items: 27, visitors: 30, cash: 500 }),
    day(13, { revenue: 3100, objective: 2000, tickets: 20, items: 31, cash: 815 }),
    day(14, { revenue: 3200, objective: 2000, tickets: 21, items: 33, cash: 600 }),
    day(15, { revenue: 2500, objective: 2000, tickets: 17, items: 26, cash: 400 }),
    day(16, { revenue: 2299, objective: 2000, tickets: 16, items: 25, cash: 500 }),
    day(17, { revenue: 300, objective: 5000, tickets: 4, items: 6 }),
    day(18, { revenue: 0, objective: 3500 }),
    day(19, {}),
  ],
  fetchedAt: '2026-10-19T08:00:00.000Z',
};

const NOVEMBER: MonthReport = {
  month: { year: 2026, month: 11 },
  tabName: 'Novembre',
  extraColumns: [],
  days: [day(1, { revenue: 1000, objective: 1500 }), day(2, { objective: 2000 })],
  fetchedAt: '2026-11-02T08:00:00.000Z',
};

describe('week dates', () => {
  it('finds the Monday and labels the week', () => {
    expect(mondayOf('2026-10-18')).toBe('2026-10-12');
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
    expect(weekRange('2026-10-12')).toBe('12/10 – 18/10');
    expect(weekSpan('2026-10-12')).toBe('du 12 au 18 octobre 2026');
    expect(weekSpan('2026-10-26')).toBe('du 26 octobre au 1er novembre 2026');
    expect(weekSpan('2026-12-28')).toBe('du 28 décembre 2026 au 3 janvier 2027');
  });

  it('numbers weeks the ISO way', () => {
    expect(isoWeekNumber('2026-10-12')).toBe(42);
    expect(isoWeekNumber('2026-12-28')).toBe(53);
    expect(isoWeekNumber('2027-01-04')).toBe(1);
  });

  it('dates instants in Paris', () => {
    expect(storeDate(new Date('2026-10-18T22:30:00Z'))).toBe('2026-10-19');
  });

  it('accepts only real dates in URLs', () => {
    expect(parseWeekSlug('2026-10-14')).toBe('2026-10-14');
    expect(parseWeekSlug('2026-02-30')).toBeUndefined();
    expect(parseWeekSlug('semaine-42')).toBeUndefined();
  });
});

describe('weekRecap', () => {
  const recap = weekRecap([OCTOBER, NOVEMBER], '2026-10-12');

  it('averages per open day, like the store recap', () => {
    expect(recap.current.totals.revenue).toBe(13899);
    // Sunday (0 €) is closed and doesn't count; the near-empty Saturday does
    expect(recap.current.openDays).toBe(6);
    expect(recap.current.revenuePerDay).toBeCloseTo(2316.5);
    expect(recap.current.ticketsPerDay).toBe(16);
    expect(recap.current.itemsPerDay).toBeCloseTo(24.67, 2);
    expect(recap.current.cash).toBe(2815);
  });

  it('compares with the week before', () => {
    expect(recap.previous.totals.revenue).toBe(18532);
    expect(relativeChange(recap.current.totals.revenue, recap.previous.totals.revenue)).toBeCloseTo(
      -0.25,
      2,
    );
    expect(recap.previous.cash).toBeUndefined();
    expect(relativeChange(10, undefined)).toBeUndefined();
    expect(relativeChange(10, 0)).toBeUndefined();
  });

  it('gives the month to date at the end of the week', () => {
    expect(recap.monthToDate).toEqual({
      month: { year: 2026, month: 10 },
      throughDay: 18,
      revenue: 18532 + 13899,
      objective: 50000,
      attainment: (18532 + 13899) / 50000,
    });
  });

  it('spans two months and reports on the last one with figures', () => {
    const across = weekRecap([OCTOBER, NOVEMBER], '2026-10-26');
    expect(across.days.map((entry) => entry.date)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(across.current.totals.revenue).toBe(1000);
    expect(across.monthToDate?.month).toEqual({ year: 2026, month: 11 });
    expect(across.monthToDate?.objective).toBe(3500);
    expect(across.extraColumns).toEqual(['Retours']);
  });

  it('compares a week in progress with the same days of S-1', () => {
    // Thursday morning: Monday → Wednesday are in
    const typedSoFar = { ...OCTOBER, days: OCTOBER.days.filter((entry) => entry.day <= 14) };
    const inProgress = weekRecap([typedSoFar], '2026-10-12', '2026-10-15');
    expect(inProgress.comparedDays).toBe(3);
    expect(inProgress.previous.totals.revenue).toBe(9000);
    // Over, or no date given: the whole week
    expect(weekRecap([OCTOBER], '2026-10-12', '2026-10-19').comparedDays).toBe(7);
    expect(recap.comparedDays).toBe(7);
  });

  it('counts a blank past day as closed, not as missing', () => {
    // Sunday evening, Sunday left blank: still the whole week
    expect(weekRecap([OCTOBER], '2026-10-05', '2026-10-11').comparedDays).toBe(6);
    expect(weekRecap([OCTOBER], '2026-10-05', '2026-10-12').comparedDays).toBe(7);
  });

  it('says when the week has nothing typed in', () => {
    expect(weekRecap([OCTOBER], '2026-10-19').hasData).toBe(false);
  });
});

describe('week lists', () => {
  it('lists covered weeks and the latest filled one', () => {
    const weeks = coveredWeeks([OCTOBER, NOVEMBER]);
    expect(weeks[0]).toBe('2026-09-28');
    expect(weeks.at(-1)).toBe('2026-11-30');
    expect(latestFilledWeek([OCTOBER, NOVEMBER])).toBe('2026-10-26');
    expect(latestFilledWeek([])).toBeUndefined();
  });

  it('keeps only the months a week needs', () => {
    expect(reportsForWeek([OCTOBER, NOVEMBER], '2026-10-12')).toEqual([OCTOBER]);
    expect(reportsForWeek([OCTOBER, NOVEMBER], '2026-11-02')).toEqual([OCTOBER, NOVEMBER]);
  });
});
