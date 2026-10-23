import { computeTotals, type Totals } from './kpis';
import { daysInMonth, monthId, monthName, type MonthKey } from './months';
import type { DayEntry, MonthReport } from './types';

/** A calendar date, "2026-10-12". Weeks are identified by their Monday. */
export type IsoDate = string;

const toUtc = (date: IsoDate): Date => new Date(`${date}T00:00:00Z`);
const fromUtc = (date: Date): IsoDate => date.toISOString().slice(0, 10);

export const addDays = (date: IsoDate, days: number): IsoDate => {
  const next = toUtc(date);
  next.setUTCDate(next.getUTCDate() + days);
  return fromUtc(next);
};

export const dateOf = (month: MonthKey, day: number): IsoDate =>
  fromUtc(new Date(Date.UTC(month.year, month.month - 1, day)));

const monthOf = (date: IsoDate): MonthKey => {
  const utc = toUtc(date);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1 };
};

const dayOf = (date: IsoDate): number => toUtc(date).getUTCDate();

/** The Monday of the week `date` falls in. */
export const mondayOf = (date: IsoDate): IsoDate =>
  addDays(date, -((toUtc(date).getUTCDay() + 6) % 7));

/** Reads a "/semaine/2026-10-12" URL segment. Any real date is accepted; the page redirects to
 * its Monday. */
export const parseWeekSlug = (slug: string): IsoDate | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slug)) {
    return undefined;
  }
  const date = toUtc(slug);
  return Number.isNaN(date.getTime()) || fromUtc(date) !== slug ? undefined : slug;
};

/** ISO 8601 week number (S1 is the week with the year's first Thursday). */
export const isoWeekNumber = (monday: IsoDate): number => {
  const thursday = toUtc(addDays(monday, 3));
  const firstThursday = toUtc(mondayOf(`${thursday.getUTCFullYear()}-01-04`));
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3);
  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
};

const twoDigits = (value: number) => String(value).padStart(2, '0');

/** "12/10" */
export const shortDate = (date: IsoDate): string => {
  const { month } = monthOf(date);
  return `${twoDigits(dayOf(date))}/${twoDigits(month)}`;
};

/** "12/10 – 18/10", as in the store's weekly recap */
export const weekRange = (monday: IsoDate): string =>
  `${shortDate(monday)} – ${shortDate(addDays(monday, 6))}`;

const longDay = (date: IsoDate): string => {
  const day = dayOf(date);
  return day === 1 ? '1er' : String(day);
};

/** "du 12 au 18 octobre 2026", "du 26 octobre au 1er novembre 2026" */
export const weekSpan = (monday: IsoDate): string => {
  const sunday = addDays(monday, 6);
  const [from, to] = [monthOf(monday), monthOf(sunday)];
  const toLabel = `${longDay(sunday)} ${monthName(to).toLowerCase()} ${to.year}`;
  if (from.month === to.month) {
    return `du ${longDay(monday)} au ${toLabel}`;
  }
  const fromYear = from.year === to.year ? '' : ` ${from.year}`;
  return `du ${longDay(monday)} ${monthName(from).toLowerCase()}${fromYear} au ${toLabel}`;
};

/** One calendar day of a week, with what the sheet says about it (if its month has a tab). */
export type WeekDay = {
  date: IsoDate;
  month: MonthKey;
  day: number;
  entry?: DayEntry;
};

const indexDays = (reports: MonthReport[]): Map<IsoDate, DayEntry> =>
  new Map(
    reports.flatMap((report) => report.days.map((day) => [dateOf(report.month, day.day), day])),
  );

const weekDays = (monday: IsoDate, index: Map<IsoDate, DayEntry>): WeekDay[] =>
  Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(monday, offset);
    return { date, month: monthOf(date), day: dayOf(date), entry: index.get(date) };
  });

/** The figures of the store's weekly recap. "Par jour" figures are averaged over the days the
 * store was open (CA above zero), like the sheet's weekly block — a closed Sunday doesn't drag
 * them down. */
export type WeekFigures = {
  totals: Totals;
  openDays: number;
  revenuePerDay?: number;
  ticketsPerDay?: number;
  itemsPerDay?: number;
  /** Undefined when no day of the week has a cash amount */
  cash?: number;
};

const average = (values: (number | undefined)[]): number | undefined => {
  const present = values.filter((value): value is number => value !== undefined);
  return present.length === 0
    ? undefined
    : present.reduce((total, value) => total + value, 0) / present.length;
};

export const weekFigures = (days: DayEntry[]): WeekFigures => {
  const open = days.filter((day) => (day.revenue ?? 0) > 0);
  const totals = computeTotals(days);
  const cashDays = days.filter((day) => day.cash !== undefined);

  return {
    totals,
    openDays: open.length,
    revenuePerDay: open.length === 0 ? undefined : totals.revenue / open.length,
    ticketsPerDay: average(open.map((day) => day.tickets)),
    itemsPerDay: average(open.map((day) => day.items)),
    cash: cashDays.length === 0 ? undefined : cashDays.reduce((total, day) => total + day.cash!, 0),
  };
};

/** Relative change, "−25 %" in the recap. Undefined when either side is missing or zero. */
export const relativeChange = (
  current: number | undefined,
  previous: number | undefined,
): number | undefined =>
  current === undefined || previous === undefined || previous === 0
    ? undefined
    : current / previous - 1;

/** Month-to-date at the end of the week: "Objectif mois Octobre 50 k HT · Réalisé 40 653 (81 %)" */
export type MonthToDate = {
  month: MonthKey;
  /** Last day of the month counted (the week's Sunday, or the month's last day) */
  throughDay: number;
  revenue: number;
  objective: number;
  attainment?: number;
};

export type WeekRecap = {
  start: IsoDate;
  days: WeekDay[];
  previousDays: WeekDay[];
  current: WeekFigures;
  previous: WeekFigures;
  monthToDate?: MonthToDate;
  /** Extra sheet columns of the months the week spans */
  extraColumns: string[];
  /** Some day of the week has a CA */
  hasData: boolean;
  /** How many days (from Monday) S-1 is compared over: 7 once the week is over, fewer while it's
   * in progress, so Monday → Thursday isn't measured against a whole week */
  comparedDays: number;
};

const entries = (days: WeekDay[]): DayEntry[] =>
  days.flatMap((day) => (day.entry === undefined ? [] : [day.entry]));

const monthToDate = (reports: MonthReport[], days: WeekDay[]): MonthToDate | undefined => {
  // The month the recap reports on: the one of the week's last day with a CA (a week ending on
  // the 1st still reports on the month before), else the Monday's
  const lastFilled = days.findLast((day) => day.entry?.revenue !== undefined) ?? days[0];
  const report = reports.find(
    (candidate) => monthId(candidate.month) === monthId(lastFilled.month),
  );
  if (report === undefined) {
    return undefined;
  }

  const sunday = days[days.length - 1];
  const throughDay =
    monthId(sunday.month) === monthId(report.month) ? sunday.day : daysInMonth(report.month);
  const revenue = report.days
    .filter((day) => day.day <= throughDay)
    .reduce((total, day) => total + (day.revenue ?? 0), 0);
  const objective =
    report.monthlyObjective ?? report.days.reduce((total, day) => total + (day.objective ?? 0), 0);

  return {
    month: report.month,
    throughDay,
    revenue,
    objective,
    attainment: objective > 0 ? revenue / objective : undefined,
  };
};

/** Days of the week that can have figures by `today`: the ones before it, or up to the last day
 * already typed in (today's figures may be in by the evening). A blank past day is a closed or
 * empty day, and counts. */
const daysToCompare = (days: WeekDay[], today: IsoDate | undefined): number => {
  if (today === undefined || today > days[6].date) {
    return 7;
  }
  const lastFilled = days.findLastIndex((day) => day.entry?.revenue !== undefined);
  const lastPast = days.findLastIndex((day) => day.date < today);
  return Math.max(lastFilled, lastPast) + 1;
};

/** The week starting `monday`. Pass `today` so that a week in progress is compared with the same
 * days of S-1. */
export const weekRecap = (reports: MonthReport[], monday: IsoDate, today?: IsoDate): WeekRecap => {
  const index = indexDays(reports);
  const days = weekDays(monday, index);
  const previousDays = weekDays(addDays(monday, -7), index);
  const spanned = new Set(days.map((day) => monthId(day.month)));
  const comparedDays = daysToCompare(days, today);

  return {
    start: monday,
    days,
    previousDays,
    current: weekFigures(entries(days)),
    previous: weekFigures(entries(previousDays.slice(0, comparedDays))),
    monthToDate: monthToDate(reports, days),
    extraColumns: [
      ...new Set(
        reports
          .filter((report) => spanned.has(monthId(report.month)))
          .flatMap((report) => report.extraColumns),
      ),
    ],
    hasData: days.some((day) => day.entry?.revenue !== undefined),
    comparedDays,
  };
};

/** The calendar date at the store (Paris) at that instant */
export const storeDate = (instant: Date): IsoDate =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(instant);

/** The months a week's recap reads (its own, the week before, and month-to-date): what a
 * published weekly presentation has to freeze. */
export const reportsForWeek = (reports: MonthReport[], monday: IsoDate): MonthReport[] => {
  const needed = new Set(
    Array.from({ length: 14 }, (_, offset) => monthId(monthOf(addDays(monday, offset - 7)))),
  );
  return reports.filter((report) => needed.has(monthId(report.month)));
};

/** Mondays of every week the sheet's tabs cover, chronological — for week navigation. */
export const coveredWeeks = (reports: MonthReport[]): IsoDate[] => {
  const mondays = new Set<IsoDate>();
  for (const report of reports) {
    for (let day = 1; day <= daysInMonth(report.month); day += 1) {
      mondays.add(mondayOf(dateOf(report.month, day)));
    }
  }
  return [...mondays].sort();
};

/** Monday of the latest week with a CA typed in, if any. */
export const latestFilledWeek = (reports: MonthReport[]): IsoDate | undefined => {
  const filled = reports.flatMap((report) =>
    report.days
      .filter((day) => day.revenue !== undefined)
      .map((day) => dateOf(report.month, day.day)),
  );
  return filled.length === 0 ? undefined : mondayOf(filled.sort().at(-1)!);
};
