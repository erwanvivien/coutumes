import { compareMonths, monthId, resolveTabMonths, type MonthKey } from '@/lib/report/months';
import { parseMonthTab } from '@/lib/report/sheetParser';
import type { MonthReport } from '@/lib/report/types';
import { unstable_cache } from 'next/cache';
import { fetchTabNames, fetchTabs, getSheetConfig } from './sheets/client';

export const SHEET_CACHE_TAG = 'sheet';

// The sheet is edited by hand a few times a day; the "Rafraîchir" button bypasses this anyway.
const SHEET_CACHE_SECONDS = 5 * 60;

const fallbackYear = (): number => {
  const fromEnv = Number(process.env.GOOGLE_SHEET_DEFAULT_YEAR);
  return Number.isInteger(fromEnv) && fromEnv > 2000 ? fromEnv : new Date().getFullYear();
};

const loadAllMonths = unstable_cache(
  async (): Promise<MonthReport[]> => {
    const config = getSheetConfig();
    const tabs = resolveTabMonths(await fetchTabNames(config), fallbackYear());
    const grids = await fetchTabs(
      config,
      tabs.map(({ tabName }) => tabName),
    );
    const fetchedAt = new Date();

    return tabs
      .flatMap(({ tabName, month }) => {
        try {
          return [parseMonthTab({ tabName, month, rows: grids.get(tabName) ?? [], fetchedAt })];
        } catch (error) {
          // A month tab that doesn't follow the layout shouldn't take the whole dashboard down
          console.warn(`Skipping tab "${tabName}":`, error);
          return [];
        }
      })
      .sort((a, b) => compareMonths(a.month, b.month));
  },
  ['sheet-months'],
  { revalidate: SHEET_CACHE_SECONDS, tags: [SHEET_CACHE_TAG] },
);

export const getMonthReports = (): Promise<MonthReport[]> => loadAllMonths();

export const getMonthReport = async (month: MonthKey): Promise<MonthReport | undefined> => {
  const reports = await loadAllMonths();
  return reports.find((report) => monthId(report.month) === monthId(month));
};
