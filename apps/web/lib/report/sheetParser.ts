import { daysInMonth, normalizeText, type MonthKey } from './months';
import type { DayEntry, MonthReport } from './types';

/** A cell as returned by the Sheets API with UNFORMATTED_VALUE + FORMATTED_STRING dates. */
export type Cell = string | number | boolean | null | undefined;

type KnownField = 'revenue' | 'objective' | 'tickets' | 'items' | 'visitors' | 'cash';

// Header (normalized) → field. Anything not listed here and not computed becomes an extra column.
const KNOWN_HEADERS: Record<string, KnownField> = {
  realise: 'revenue',
  'ca realise': 'revenue',
  ca: 'revenue',
  'ca ht': 'revenue',
  objectif: 'objective',
  'objectif ht': 'objective',
  tickets: 'tickets',
  ticket: 'tickets',
  quantites: 'items',
  quantite: 'items',
  articles: 'items',
  passages: 'visitors',
  entrees: 'visitors',
  cash: 'cash',
  'cash caisse': 'cash',
  'montant cash': 'cash',
  'montant cash caisse': 'cash',
  especes: 'cash',
};

// Columns the sheet computes with formulas — we recompute them ourselves, so they're skipped.
const COMPUTED_HEADERS = new Set(['iv', 'pm', 'tt', 'diff', 'diff +/-', 'ecart', '%', 'taux']);

const isBlank = (cell: Cell): boolean =>
  cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '');

/** Reads a number from a cell, accepting French formatting ("1 234,50 €", "12 %").
 * Errors such as "#DIV/0!" and blanks give undefined. */
export const parseNumber = (cell: Cell): number | undefined => {
  if (typeof cell === 'number') {
    return Number.isFinite(cell) ? cell : undefined;
  }
  if (typeof cell !== 'string' || cell.trim() === '' || cell.trim().startsWith('#')) {
    return undefined;
  }

  const isPercent = cell.includes('%');
  const cleaned = cell
    .replace(/[\s  €%]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const value = Number(cleaned);
  if (cleaned === '' || Number.isNaN(value)) {
    return undefined;
  }
  return isPercent ? value / 100 : value;
};

/** Pulls the day of the month out of "lundi 2 novembre", "02/11/2026" or "2". */
const parseDay = (cell: Cell, maxDay: number): number | undefined => {
  if (typeof cell === 'number') {
    return Number.isInteger(cell) && cell >= 1 && cell <= maxDay ? cell : undefined;
  }
  if (typeof cell !== 'string') {
    return undefined;
  }

  const match = /\b(\d{1,2})\b/.exec(cell);
  const day = match === null ? undefined : Number(match[1]);
  return day !== undefined && day >= 1 && day <= maxDay ? day : undefined;
};

/** The tab can't be read as a month at all. The message is shown to the store owner. */
export class TabLayoutError extends Error {}

const FIELD_LABELS: Record<KnownField, string> = {
  revenue: 'Réalisé',
  objective: 'Objectif',
  tickets: 'Tickets',
  items: 'Quantités',
  visitors: 'Passages',
  cash: 'Cash',
};

/** Turns a month tab's grid into a MonthReport, plus the problems worth telling the owner about
 * (in French, shown as-is). Throws TabLayoutError when there's no table to read.
 *
 * Expected layout (the one from the store's sheet), but tolerant of extra or moved columns:
 *   - somewhere above the table, "Objectif HT" followed by the month objective
 *   - a header row whose first column is "Date", then one column per figure, ending at the
 *     first empty header (so the weekly summary block on the right is ignored)
 *   - one row per day, until a "Total" row or an empty date */
export const parseMonthTab = ({
  tabName,
  month,
  rows,
  fetchedAt,
}: {
  tabName: string;
  month: MonthKey;
  rows: Cell[][];
  fetchedAt: Date;
}): { report: MonthReport; issues: string[] } => {
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => typeof cell === 'string' && normalizeText(cell) === 'date'),
  );
  if (headerIndex === -1) {
    throw new TabLayoutError('Aucune ligne d’en-tête commençant par « Date »');
  }

  const headerRow = rows[headerIndex];
  const dateColumn = headerRow.findIndex(
    (cell) => typeof cell === 'string' && normalizeText(cell) === 'date',
  );

  const known: Partial<Record<KnownField, number>> = {};
  const extras: { header: string; column: number }[] = [];
  for (let column = dateColumn + 1; column < headerRow.length; column++) {
    const cell = headerRow[column];
    if (isBlank(cell)) {
      break;
    }

    const header = String(cell).trim();
    const normalized = normalizeText(header);
    const field = KNOWN_HEADERS[normalized] as KnownField | undefined;
    if (field !== undefined && known[field] === undefined) {
      known[field] = column;
    } else if (!COMPUTED_HEADERS.has(normalized)) {
      extras.push({ header, column });
    }
  }

  const monthlyObjective = findMonthlyObjective(rows.slice(0, headerIndex));

  const maxDay = daysInMonth(month);
  const days: DayEntry[] = [];
  const skipped: string[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const dateCell = row[dateColumn];
    if (isBlank(dateCell) || normalizeText(String(dateCell)).startsWith('total')) {
      break;
    }

    const day = parseDay(dateCell, maxDay);
    if (day === undefined || days.some((entry) => entry.day === day)) {
      skipped.push(String(dateCell).trim());
      continue;
    }

    const read = (column: number | undefined) =>
      column === undefined ? undefined : parseNumber(row[column]);

    days.push({
      day,
      revenue: read(known.revenue),
      objective: read(known.objective),
      tickets: read(known.tickets),
      items: read(known.items),
      visitors: read(known.visitors),
      cash: read(known.cash),
      extras: Object.fromEntries(extras.map(({ header, column }) => [header, read(column)])),
    });
  }

  days.sort((a, b) => a.day - b.day);

  const issues: string[] = [];
  if (known.revenue === undefined) {
    issues.push('Colonne « Réalisé » introuvable : le chiffre d’affaires reste vide');
  }
  // Cash is optional: only some stores track it
  const missing = (['objective', 'tickets', 'items', 'visitors'] as const).filter(
    (field) => known[field] === undefined,
  );
  if (missing.length > 0) {
    issues.push(
      `Colonne${missing.length > 1 ? 's' : ''} introuvable${missing.length > 1 ? 's' : ''} : ${missing.map((field) => `« ${FIELD_LABELS[field]} »`).join(', ')}`,
    );
  }
  if (days.length === 0) {
    issues.push('Aucune ligne de jour sous l’en-tête « Date »');
  }
  if (skipped.length > 0) {
    issues.push(
      `${skipped.length} ligne${skipped.length > 1 ? 's' : ''} ignorée${skipped.length > 1 ? 's' : ''} (date illisible ou en double) : « ${skipped[0]} »${skipped.length > 1 ? '…' : ''}`,
    );
  }

  return {
    report: {
      month,
      tabName,
      monthlyObjective,
      extraColumns: extras.map(({ header }) => header),
      days,
      fetchedAt: fetchedAt.toISOString(),
    },
    issues,
  };
};

const findMonthlyObjective = (rows: Cell[][]): number | undefined => {
  for (const row of rows) {
    const index = row.findIndex(
      (cell) => typeof cell === 'string' && normalizeText(cell).startsWith('objectif'),
    );
    if (index !== -1) {
      const value = parseNumber(row[index + 1]);
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
};
