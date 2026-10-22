import { daysInMonth, resolveTabMonths, weekdayIndex, weekdayName } from '@/lib/report/months';
import type { Cell } from '@/lib/report/sheetParser';

/** Fake spreadsheet for stores using demo data, laid out exactly like the store's sheet, so
 * the dashboard can be tried (and the parser exercised) without Google credentials. */
const DEMO_TABS = ['Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier 27'];
const MONTH_OBJECTIVE = 60000;

// Deterministic so the demo looks the same on every reload
const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Share of the week's objective by weekday (lundi … samedi); the store is closed on Sundays
const WEEKDAY_WEIGHTS = [0.8, 0.85, 1, 0.95, 1.2, 1.6, 0];

const buildTab = (tabName: string, year: number, month: number, today: Date): Cell[][] => {
  const key = { year, month };
  const dayCount = daysInMonth(key);
  const weights = Array.from(
    { length: dayCount },
    (_, i) => WEEKDAY_WEIGHTS[weekdayIndex(key, i + 1)],
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const monthName = tabName.split(' ')[0].toLowerCase();

  const rows: Cell[][] = [
    ['Objectif HT', MONTH_OBJECTIVE, 'Réalisé', '', 'Diff +/-', '', '120%'],
    ['Date', 'Réalisé', 'Objectif', 'Tickets', 'Quantités', 'IV', 'PM', 'Passages', 'TT'],
  ];
  if (month === 10) {
    rows[1].push('Retours');
  }

  for (let day = 1; day <= dayCount; day++) {
    const objective = Math.round((MONTH_OBJECTIVE * weights[day - 1]) / weightSum);
    const label = `${weekdayName(key, day).toLowerCase()} ${day} ${monthName}`;
    const isPast = new Date(Date.UTC(year, month - 1, day)) < today;

    if (objective === 0 || !isPast) {
      rows.push([label, '', objective || '', '', '', '#DIV/0!', '#DIV/0!', '', '#DIV/0!']);
      continue;
    }

    const seed = year * 1000 + month * 40 + day;
    const revenue = Math.round(objective * (0.78 + pseudoRandom(seed) * 0.45));
    const basket = 52 + pseudoRandom(seed + 1) * 18;
    const tickets = Math.max(1, Math.round(revenue / basket));
    const items = Math.round(tickets * (1.6 + pseudoRandom(seed + 2) * 0.7));
    const visitors = Math.round(tickets / (0.18 + pseudoRandom(seed + 3) * 0.1));
    const row: Cell[] = [label, revenue, objective, tickets, items, '', '', visitors, ''];
    if (month === 10) {
      row.push(Math.round(pseudoRandom(seed + 4) * 4));
    }
    rows.push(row);
  }

  rows.push(['Total', '#REF!', MONTH_OBJECTIVE]);
  return rows;
};

export const demoTabNames = (): string[] => [...DEMO_TABS, 'Récap'];

export const demoTabs = (tabNames: string[]): Map<string, Cell[][]> => {
  const today = new Date();
  const months = new Map(
    resolveTabMonths(DEMO_TABS, today.getFullYear()).map(({ tabName, month }) => [tabName, month]),
  );

  return new Map(
    tabNames.map((tabName) => {
      const month = months.get(tabName);
      return [
        tabName,
        month === undefined ? [] : buildTab(tabName, month.year, month.month, today),
      ];
    }),
  );
};
