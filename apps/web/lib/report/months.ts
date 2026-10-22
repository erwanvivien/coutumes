/** A calendar month. `month` is 1-based (1 = janvier). */
export type MonthKey = {
  year: number;
  month: number;
};

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

/** Lowercases and strips accents, so "Février " and "fevrier" compare equal. */
export const normalizeText = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const MONTH_SLUGS = MONTH_NAMES.map(normalizeText);

// Abbreviations people commonly use for tab names ("Sept 26", "Janv 27")
const MONTH_ALIASES: Record<string, number> = {
  ...Object.fromEntries(MONTH_SLUGS.map((slug, index) => [slug, index + 1])),
  janv: 1,
  fev: 2,
  fevr: 2,
  avr: 4,
  juil: 7,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export const monthName = (key: MonthKey): string => MONTH_NAMES[key.month - 1];

/** "Novembre 2026" */
export const monthLabel = (key: MonthKey): string => `${monthName(key)} ${key.year}`;

/** "2026-novembre" — used as the URL segment for a month. */
export const monthSlug = (key: MonthKey): string => `${key.year}-${MONTH_SLUGS[key.month - 1]}`;

export const parseMonthSlug = (slug: string): MonthKey | undefined => {
  const match = /^(\d{4})-([a-z]+)$/.exec(normalizeText(decodeURIComponent(slug)));
  if (match === null) {
    return undefined;
  }

  const month = MONTH_SLUGS.indexOf(match[2]);
  if (month === -1) {
    return undefined;
  }

  return { year: Number(match[1]), month: month + 1 };
};

/** "2026-11" — stable storage key, independent of the URL language. */
export const monthId = (key: MonthKey): string =>
  `${key.year}-${String(key.month).padStart(2, '0')}`;

export const compareMonths = (a: MonthKey, b: MonthKey): number =>
  a.year - b.year || a.month - b.month;

export const daysInMonth = (key: MonthKey): number =>
  new Date(Date.UTC(key.year, key.month, 0)).getUTCDate();

/** 0 = lundi … 6 = dimanche */
export const weekdayIndex = (key: MonthKey, day: number): number =>
  (new Date(Date.UTC(key.year, key.month - 1, day)).getUTCDay() + 6) % 7;

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const weekdayName = (key: MonthKey, day: number): string => WEEKDAYS[weekdayIndex(key, day)];

/** Reads a sheet tab name such as "Novembre", "Janvier 27" or "Mars 2026".
 * `year` is undefined when the tab doesn't say. */
export const parseTabName = (name: string): { month: number; year?: number } | undefined => {
  const match = /^([a-z]+)\.?(?:\s+'?(\d{2}|\d{4}))?$/.exec(normalizeText(name));
  if (match === null) {
    return undefined;
  }

  const month = MONTH_ALIASES[match[1]] as number | undefined;
  if (month === undefined) {
    return undefined;
  }

  const rawYear = match[2] as string | undefined;
  if (rawYear === undefined) {
    return { month };
  }

  const year = Number(rawYear);
  return { month, year: year < 100 ? 2000 + year : year };
};

/** Maps the sheet's tabs to calendar months.
 *
 * Tabs usually only carry a year once it differs from the "main" one ("Novembre", "Décembre",
 * "Janvier 27"), so a tab without a year borrows it from its neighbours: tabs are assumed to be in
 * chronological order, and the year rolls over whenever the month number goes back down.
 * `fallbackYear` is used when no tab names a year at all. Non-month tabs are left out. */
export const resolveTabMonths = (
  tabNames: string[],
  fallbackYear: number,
): { tabName: string; month: MonthKey }[] => {
  const parsed = tabNames
    .map((tabName) => ({ tabName, parsed: parseTabName(tabName) }))
    .filter(
      (tab): tab is { tabName: string; parsed: NonNullable<ReturnType<typeof parseTabName>> } =>
        tab.parsed !== undefined,
    );

  const anchorIndex = parsed.findIndex((tab) => tab.parsed.year !== undefined);
  const years: number[] = new Array<number>(parsed.length);

  if (anchorIndex === -1) {
    // No explicit year anywhere: anchor the first tab on the fallback year
    let year = fallbackYear;
    parsed.forEach((tab, index) => {
      if (index > 0 && tab.parsed.month < parsed[index - 1].parsed.month) {
        year += 1;
      }
      years[index] = year;
    });
  } else {
    // Walk forward from the anchor (explicit years reset it), then backward for earlier tabs
    let year = parsed[anchorIndex].parsed.year ?? fallbackYear;
    for (let index = anchorIndex; index < parsed.length; index++) {
      const tab = parsed[index].parsed;
      if (tab.year !== undefined) {
        year = tab.year;
      } else if (tab.month < parsed[index - 1].parsed.month) {
        year += 1;
      }
      years[index] = year;
    }

    year = years[anchorIndex];
    for (let index = anchorIndex - 1; index >= 0; index--) {
      if (parsed[index].parsed.month > parsed[index + 1].parsed.month) {
        year -= 1;
      }
      years[index] = year;
    }
  }

  return parsed.map((tab, index) => ({
    tabName: tab.tabName,
    month: { year: years[index], month: tab.parsed.month },
  }));
};
