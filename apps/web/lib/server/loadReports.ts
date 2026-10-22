import type { MonthReport } from '@/lib/report/types';
import { getMonthReports } from './report';
import { SheetNotConfiguredError } from './sheets/client';

export type LoadedReports =
  | { kind: 'ok'; reports: MonthReport[] }
  | { kind: 'not-configured' }
  | { kind: 'error'; message: string };

/** Like getMonthReports, but turns failures into something a page can explain. */
export const loadReports = async (): Promise<LoadedReports> => {
  try {
    return { kind: 'ok', reports: await getMonthReports() };
  } catch (error) {
    if (error instanceof SheetNotConfiguredError) {
      return { kind: 'not-configured' };
    }
    console.error('Failed to read the Google Sheet', error);
    return { kind: 'error', message: error instanceof Error ? error.message : String(error) };
  }
};
