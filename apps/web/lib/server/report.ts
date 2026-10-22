import { compareMonths, monthId, resolveTabMonths, type MonthKey } from '@/lib/report/months';
import { parseMonthTab } from '@/lib/report/sheetParser';
import type { MonthReport } from '@/lib/report/types';
import type { Store } from '@/lib/schemas/database/store';
import { unstable_cache } from 'next/cache';
import { fetchTabNames, fetchTabs, type SheetSource } from './sheets/client';
import { sheetSource } from './stores';

/** Cache tag of one store's sheet — "Rafraîchir" expires only that store's figures. */
export const sheetCacheTag = (storeId: string): string => `sheet:${storeId}`;

// The sheet is edited by hand a few times a day; the "Rafraîchir" button bypasses this anyway.
const SHEET_CACHE_SECONDS = 5 * 60;

const fallbackYear = (): number => {
  const fromEnv = Number(process.env.GOOGLE_SHEET_DEFAULT_YEAR);
  return Number.isInteger(fromEnv) && fromEnv > 2000 ? fromEnv : new Date().getFullYear();
};

const readAllMonths = async (source: SheetSource): Promise<MonthReport[]> => {
  const tabs = resolveTabMonths(await fetchTabNames(source), fallbackYear());
  const grids = await fetchTabs(
    source,
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
};

/** Every month tab of the store's sheet, parsed. Throws if the store has no sheet or Google
 * refuses access — see loadReports for a page-friendly version. */
export const getMonthReports = (store: Store): Promise<MonthReport[]> => {
  const source = sheetSource(store);
  const sourceKey = source.kind === 'demo' ? 'demo' : source.spreadsheetId;
  return unstable_cache(() => readAllMonths(source), ['sheet-months', store.id, sourceKey], {
    revalidate: SHEET_CACHE_SECONDS,
    tags: [sheetCacheTag(store.id)],
  })();
};

export const getMonthReport = async (
  store: Store,
  month: MonthKey,
): Promise<MonthReport | undefined> => {
  const reports = await getMonthReports(store);
  return reports.find((report) => monthId(report.month) === monthId(month));
};
