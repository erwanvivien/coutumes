import { compareMonths, monthId, monthLabel, resolveTabMonths } from './months';
import { parseMonthTab, TabLayoutError, type Cell } from './sheetParser';
import type { MonthReport, SheetRead, SheetTab } from './types';

/** Reads every tab of a sheet: month tabs become reports, and each tab gets a status so the
 * dashboard can flag the ones it couldn't (fully) use. */
export const readSheet = ({
  tabNames,
  grids,
  fallbackYear,
  fetchedAt,
}: {
  tabNames: string[];
  grids: Map<string, Cell[][]>;
  fallbackYear: number;
  fetchedAt: Date;
}): SheetRead => {
  const months = new Map(
    resolveTabMonths(tabNames, fallbackYear).map(({ tabName, month }) => [tabName, month]),
  );
  const claimedBy = new Map<string, string>();
  const reports: MonthReport[] = [];

  const tabs = tabNames.map((tabName): SheetTab => {
    const month = months.get(tabName);
    if (month === undefined) {
      return {
        tabName,
        status: 'invalid',
        issues: ['Le nom de l’onglet n’est pas un mois (ex. « Novembre » ou « Janvier 27 »)'],
      };
    }

    const owner = claimedBy.get(monthId(month));
    if (owner !== undefined) {
      return {
        tabName,
        status: 'invalid',
        month,
        issues: [`${monthLabel(month)} est déjà lu depuis l’onglet « ${owner} »`],
      };
    }

    try {
      const { report, issues } = parseMonthTab({
        tabName,
        month,
        rows: grids.get(tabName) ?? [],
        fetchedAt,
      });
      claimedBy.set(monthId(month), tabName);
      reports.push(report);
      return { tabName, status: issues.length === 0 ? 'ok' : 'warning', month, issues };
    } catch (error) {
      if (error instanceof TabLayoutError) {
        return { tabName, status: 'invalid', month, issues: [error.message] };
      }
      throw error;
    }
  });

  return { reports: reports.sort((a, b) => compareMonths(a.month, b.month)), tabs };
};
