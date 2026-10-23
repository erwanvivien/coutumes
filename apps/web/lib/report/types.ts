import type { MonthKey } from './months';

/** The raw figures typed into the sheet for one day. Missing cells are undefined. */
export type DayEntry = {
  day: number;
  /** CA HT réalisé */
  revenue?: number;
  /** Objectif de CA HT du jour */
  objective?: number;
  tickets?: number;
  /** Quantités (articles vendus) */
  items?: number;
  /** Passages (entrées en magasin) */
  visitors?: number;
  /** Montant encaissé en espèces (optional "Cash" column) */
  cash?: number;
  /** Any other column the sheet has, keyed by its header */
  extras: Record<string, number | undefined>;
};

/** Everything a month's dashboard needs. Plain JSON, so it can be stored as a snapshot. */
export type MonthReport = {
  month: MonthKey;
  tabName: string;
  /** "Objectif HT" from the top of the tab, when present */
  monthlyObjective?: number;
  /** Headers of the extra columns, in sheet order */
  extraColumns: string[];
  days: DayEntry[];
  fetchedAt: string;
};

/** How one tab of the sheet was understood. Every tab is listed, so the owner can see what's
 * wrong with the ones that aren't used (or only partly). */
export type SheetTab =
  | { tabName: string; status: 'ok' | 'warning'; month: MonthKey; issues: string[] }
  | { tabName: string; status: 'invalid'; month?: MonthKey; issues: string[] };

export type SheetRead = {
  /** Usable months (status ok or warning), chronological */
  reports: MonthReport[];
  /** Every tab, in sheet order */
  tabs: SheetTab[];
};
