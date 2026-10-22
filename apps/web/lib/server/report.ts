import { monthId, resolveTabMonths, type MonthKey } from '@/lib/report/months';
import { readSheet } from '@/lib/report/sheetReader';
import type { MonthReport, SheetRead } from '@/lib/report/types';
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

const fetchSheet = async (source: SheetSource): Promise<SheetRead> => {
  const tabNames = await fetchTabNames(source);
  // Only tabs named after a month have anything to read; the others are reported as invalid
  const monthTabs = resolveTabMonths(tabNames, fallbackYear()).map(({ tabName }) => tabName);
  const grids = await fetchTabs(source, monthTabs);
  return readSheet({ tabNames, grids, fallbackYear: fallbackYear(), fetchedAt: new Date() });
};

/** Every tab of the store's sheet: the usable months, and how each tab was understood. Throws if
 * the store has no sheet or Google refuses access — see loadReports for a page-friendly version. */
export const getSheet = (store: Store): Promise<SheetRead> => {
  const source = sheetSource(store);
  const sourceKey = source.kind === 'demo' ? 'demo' : source.spreadsheetId;
  return unstable_cache(() => fetchSheet(source), ['sheet', store.id, sourceKey], {
    revalidate: SHEET_CACHE_SECONDS,
    tags: [sheetCacheTag(store.id)],
  })();
};

export const getMonthReport = async (
  store: Store,
  month: MonthKey,
): Promise<MonthReport | undefined> => {
  const { reports } = await getSheet(store);
  return reports.find((report) => monthId(report.month) === monthId(month));
};
