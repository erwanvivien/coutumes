import type { MonthReport } from './types';

/** Converts a month's revenue and objective figures from TTC to HT, using the store's VAT rate
 * (a fraction, e.g. 0.2 for 20 %). Every other figure (tickets, visitors, cash…) is untouched. */
export const toHT = (report: MonthReport, vatRate: number): MonthReport => ({
  ...report,
  monthlyObjective:
    report.monthlyObjective === undefined ? undefined : report.monthlyObjective / (1 + vatRate),
  days: report.days.map((day) => ({
    ...day,
    revenue: day.revenue === undefined ? undefined : day.revenue / (1 + vatRate),
    objective: day.objective === undefined ? undefined : day.objective / (1 + vatRate),
  })),
});
