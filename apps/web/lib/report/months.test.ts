import { describe, expect, it } from 'vitest';
import { monthSlug, parseMonthSlug, parseTabName, resolveTabMonths } from './months';

describe('month slugs', () => {
  it('round-trips with French, accent-free names', () => {
    expect(monthSlug({ year: 2026, month: 11 })).toBe('2026-novembre');
    expect(monthSlug({ year: 2027, month: 2 })).toBe('2027-fevrier');
    expect(parseMonthSlug('2027-fevrier')).toEqual({ year: 2027, month: 2 });
  });

  it('accepts accented and URL-encoded slugs', () => {
    expect(parseMonthSlug('2026-d%C3%A9cembre')).toEqual({ year: 2026, month: 12 });
  });

  it('rejects anything else', () => {
    expect(parseMonthSlug('2026-11')).toBeUndefined();
    expect(parseMonthSlug('account')).toBeUndefined();
    expect(parseMonthSlug('2026-novembr')).toBeUndefined();
  });
});

describe('tab names', () => {
  it('reads months with and without a year', () => {
    expect(parseTabName('Novembre')).toEqual({ month: 11 });
    expect(parseTabName('Janvier 27')).toEqual({ month: 1, year: 2027 });
    expect(parseTabName(' Février 2027 ')).toEqual({ month: 2, year: 2027 });
    expect(parseTabName('Sept')).toEqual({ month: 9 });
    expect(parseTabName('Récap')).toBeUndefined();
  });

  it('infers missing years from the next explicit one', () => {
    const tabs = [
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
      'Janvier 27',
      'Février 27',
      'Récap',
    ];
    expect(resolveTabMonths(tabs, 2020).map(({ month }) => month)).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
    ]);
  });

  it('rolls the year over after an explicit one', () => {
    const tabs = ['Novembre 26', 'Décembre', 'Janvier'];
    expect(resolveTabMonths(tabs, 2020).map(({ month }) => month.year)).toEqual([2026, 2026, 2027]);
  });

  it('uses the fallback year when no tab has one', () => {
    expect(resolveTabMonths(['Novembre', 'Décembre', 'Janvier'], 2026)).toEqual([
      { tabName: 'Novembre', month: { year: 2026, month: 11 } },
      { tabName: 'Décembre', month: { year: 2026, month: 12 } },
      { tabName: 'Janvier', month: { year: 2027, month: 1 } },
    ]);
  });
});
