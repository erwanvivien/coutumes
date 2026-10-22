import { resolveTabMonths } from '@/lib/report/months';
import { parseMonthTab } from '@/lib/report/sheetParser';
import { describe, expect, it } from 'vitest';
import { demoTabNames, demoTabs } from './demo';

describe('demo sheet', () => {
  it('parses like the real one', () => {
    const tabs = resolveTabMonths(demoTabNames(), 2026);
    const grids = demoTabs(tabs.map(({ tabName }) => tabName));
    const reports = tabs.map(({ tabName, month }) =>
      parseMonthTab({ tabName, month, rows: grids.get(tabName) ?? [], fetchedAt: new Date() }),
    );

    expect(reports.map(({ tabName }) => tabName)).toEqual([
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
      'Janvier 27',
    ]);
    for (const report of reports) {
      expect(report.monthlyObjective).toBe(60000);
      expect(report.days).toHaveLength(
        new Date(report.month.year, report.month.month, 0).getDate(),
      );
    }
    expect(reports[1].extraColumns).toEqual(['Retours']);
  });
});
