import { weekdayIndex, type MonthKey } from './months';
import type { DayEntry, MonthReport } from './types';

export type Totals = {
  revenue: number;
  objective: number;
  tickets: number;
  items: number;
  visitors: number;
  /** Réalisé − objectif, over the days that have a réalisé */
  diff: number;
  /** Réalisé ÷ objectif, over the days that have a réalisé */
  attainment?: number;
  /** IV — indice de vente: articles par ticket */
  iv?: number;
  /** PM — panier moyen: CA par ticket */
  pm?: number;
  /** TT — taux de transformation: tickets ÷ passages */
  tt?: number;
  /** Number of days with a réalisé */
  daysFilled: number;
};

const sum = (values: (number | undefined)[]): number =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0);

/** Σnumerator ÷ Σdenominator over the days that have both, so a day missing its passages doesn't
 * drag the TT down. Undefined when nothing is left to divide by. */
const ratio = (
  days: DayEntry[],
  numerator: (day: DayEntry) => number | undefined,
  denominator: (day: DayEntry) => number | undefined,
): number | undefined => {
  const pairs = days.filter(
    (day) => numerator(day) !== undefined && denominator(day) !== undefined,
  );
  const bottom = sum(pairs.map(denominator));
  return bottom === 0 ? undefined : sum(pairs.map(numerator)) / bottom;
};

export const computeTotals = (days: DayEntry[]): Totals => {
  const filled = days.filter((day) => day.revenue !== undefined);

  return {
    revenue: sum(days.map((day) => day.revenue)),
    objective: sum(days.map((day) => day.objective)),
    tickets: sum(days.map((day) => day.tickets)),
    items: sum(days.map((day) => day.items)),
    visitors: sum(days.map((day) => day.visitors)),
    diff: sum(filled.map((day) => (day.revenue ?? 0) - (day.objective ?? 0))),
    attainment: ratio(
      filled,
      (day) => day.revenue,
      (day) => day.objective,
    ),
    iv: ratio(
      days,
      (day) => day.items,
      (day) => day.tickets,
    ),
    pm: ratio(
      days,
      (day) => day.revenue,
      (day) => day.tickets,
    ),
    tt: ratio(
      days,
      (day) => day.tickets,
      (day) => day.visitors,
    ),
    daysFilled: filled.length,
  };
};

export type WeekGroup = {
  /** First and last day of the month covered by this week */
  from: number;
  to: number;
  days: DayEntry[];
  totals: Totals;
};

/** Splits the month into lundi→dimanche weeks, like the sheet's weekly blocks. */
export const groupByWeek = (month: MonthKey, days: DayEntry[]): WeekGroup[] => {
  const weeks: DayEntry[][] = [];
  for (const day of days) {
    const current = weeks.at(-1);
    if (current === undefined || weekdayIndex(month, day.day) === 0) {
      weeks.push([day]);
    } else {
      current.push(day);
    }
  }

  return weeks.map((weekDays) => ({
    from: weekDays[0].day,
    to: weekDays[weekDays.length - 1].day,
    days: weekDays,
    totals: computeTotals(weekDays),
  }));
};

export type MonthSummary = {
  totals: Totals;
  /** The month's objective: the "Objectif HT" header, or the sum of daily objectives */
  monthObjective: number;
  /** Réalisé ÷ objectif du mois */
  monthAttainment?: number;
  /** Projected month-end CA if the current pace vs. objective holds */
  landing?: number;
  bestDay?: DayEntry;
  lastFilledDay?: number;
};

export const summarizeMonth = (report: MonthReport): MonthSummary => {
  const totals = computeTotals(report.days);
  const monthObjective = report.monthlyObjective ?? totals.objective;
  const filled = report.days.filter((day) => day.revenue !== undefined);

  const bestDay = filled.reduce<DayEntry | undefined>(
    (best, day) => (best === undefined || (day.revenue ?? 0) > (best.revenue ?? 0) ? day : best),
    undefined,
  );

  return {
    totals,
    monthObjective,
    monthAttainment: monthObjective > 0 ? totals.revenue / monthObjective : undefined,
    landing: totals.attainment !== undefined ? totals.attainment * monthObjective : undefined,
    bestDay,
    lastFilledDay: filled.at(-1)?.day,
  };
};
