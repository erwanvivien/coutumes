import { monthId, monthLabel, type MonthKey } from './months';
import { isoWeekNumber, mondayOf, parseWeekSlug, weekRange, type IsoDate } from './weeks';

/** What a dashboard or presentation covers: a month tab, or a week (Monday → Sunday). */
export type Period = { kind: 'month'; month: MonthKey } | { kind: 'week'; start: IsoDate };

/** Storage key of a presentation: "2026-10" for a month, "2026-10-12" (its Monday) for a week */
export const periodId = (period: Period): string =>
  period.kind === 'month' ? monthId(period.month) : period.start;

export const parsePeriodId = (id: string): Period | undefined => {
  const month = /^(\d{4})-(\d{2})$/.exec(id);
  if (month !== null) {
    const key = { year: Number(month[1]), month: Number(month[2]) };
    return key.month >= 1 && key.month <= 12 ? { kind: 'month', month: key } : undefined;
  }
  const date = parseWeekSlug(id);
  return date !== undefined && mondayOf(date) === date ? { kind: 'week', start: date } : undefined;
};

/** "Octobre 2026" / "Semaine 42 · 12/10 – 18/10" */
export const periodLabel = (period: Period): string =>
  period.kind === 'month'
    ? monthLabel(period.month)
    : `Semaine ${isoWeekNumber(period.start)} · ${weekRange(period.start)}`;
