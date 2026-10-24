import { describe, expect, it } from 'vitest';
import { toHT } from './tax';
import type { MonthReport } from './types';

const report: MonthReport = {
  month: { year: 2026, month: 11 },
  tabName: 'Novembre',
  monthlyObjective: 1200,
  extraColumns: [],
  fetchedAt: '2026-11-01T00:00:00.000Z',
  days: [
    { day: 1, revenue: 120, objective: 100, tickets: 10, extras: {} },
    { day: 2, revenue: undefined, objective: 100, cash: 50, extras: {} },
  ],
};

describe('toHT', () => {
  it('divides revenue and objective by (1 + VAT rate), leaving undefined figures alone', () => {
    const result = toHT(report, 0.2);
    expect(result.monthlyObjective).toBeCloseTo(1000);
    expect(result.days[0].revenue).toBeCloseTo(100);
    expect(result.days[0].objective).toBeCloseTo(83.33, 1);
    expect(result.days[1].revenue).toBeUndefined();
  });

  it('leaves figures untouched other than revenue and objective', () => {
    const result = toHT(report, 0.2);
    expect(result.days[0].tickets).toBe(10);
    expect(result.days[1].cash).toBe(50);
  });

  it('is a no-op at a 0% rate', () => {
    const result = toHT(report, 0);
    expect(result.monthlyObjective).toBe(1200);
    expect(result.days[0].revenue).toBe(120);
  });
});
