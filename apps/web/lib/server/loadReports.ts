import type { MonthReport } from '@/lib/report/types';
import type { Store } from '@/lib/schemas/database/store';
import { getMonthReports } from './report';
import {
  ServiceAccountMissingError,
  SheetAccessError,
  SheetNotConfiguredError,
} from './sheets/client';

export type LoadedReports =
  | { kind: 'ok'; reports: MonthReport[] }
  | { kind: 'not-configured' }
  | { kind: 'no-access' }
  | { kind: 'error'; message: string };

/** Like getMonthReports, but turns failures into something a page can explain. */
export const loadReports = async (store: Store): Promise<LoadedReports> => {
  try {
    return { kind: 'ok', reports: await getMonthReports(store) };
  } catch (error) {
    if (error instanceof SheetNotConfiguredError || error instanceof ServiceAccountMissingError) {
      return { kind: 'not-configured' };
    }
    if (error instanceof SheetAccessError) {
      return { kind: 'no-access' };
    }
    console.error('Failed to read the Google Sheet', error);
    return { kind: 'error', message: error instanceof Error ? error.message : String(error) };
  }
};
