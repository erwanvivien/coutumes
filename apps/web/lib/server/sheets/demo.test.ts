import { readSheet } from '@/lib/report/sheetReader';
import { describe, expect, it } from 'vitest';
import { demoTabNames, demoTabs } from './demo';

describe('demo sheet', () => {
  it('reads like the real one', () => {
    const tabNames = demoTabNames();
    const { reports, tabs } = readSheet({
      tabNames,
      grids: demoTabs(tabNames),
      fallbackYear: 2026,
      fetchedAt: new Date(),
    });

    expect(tabs.map(({ tabName, status }) => [tabName, status])).toEqual([
      ['Septembre', 'ok'],
      ['Octobre', 'ok'],
      ['Novembre', 'ok'],
      ['Décembre', 'ok'],
      ['Janvier 27', 'ok'],
      ['Récap', 'invalid'],
    ]);
    for (const report of reports) {
      expect(report.monthlyObjective).toBe(60000);
      expect(report.days).toHaveLength(
        new Date(report.month.year, report.month.month, 0).getDate(),
      );
    }
    expect(reports[1].extraColumns).toEqual(['Retours']);
    const filled = reports.flatMap((report) => report.days).filter((day) => day.revenue);
    expect(filled.every((day) => day.cash !== undefined && day.cash < day.revenue!)).toBe(true);
  });
});
