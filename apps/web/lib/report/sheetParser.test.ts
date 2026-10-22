import { describe, expect, it } from 'vitest';
import { computeTotals, groupByWeek, summarizeMonth } from './kpis';
import { parseMonthTab, parseNumber, type Cell } from './sheetParser';

// Mirrors the store's "Novembre" tab: objective on row 1, headers on row 2, weekly summary on the
// right (columns J/K) that must be ignored, and formula errors where data is missing.
const NOVEMBER: Cell[][] = [
  ['Objectif HT', 60000, 'Réalisé', '#REF!', 'Diff +/-', '#REF!', '120%', '#REF!', '#REF!'],
  ['Date', 'Réalisé', 'Objectif', 'Tickets', 'Quantités', 'IV', 'PM', 'Passages', 'TT'],
  ['dimanche 1 novembre', '', '', '', '', '#DIV/0!', '#DIV/0!', '', '#DIV/0!'],
  ['lundi 2 novembre', 2000, 1800, 40, 100, 2.5, 50, 200, 0.2, '#DIV/0!', 'IV'],
  ['mardi 3 novembre', '1 500,50 €', 2000, 30, 60, 2, 50, 150, 0.2, '#DIV/0!', 'PM'],
  ['mercredi 4 novembre', '', 2200, '', '', '#DIV/0!', '#DIV/0!', '', '#DIV/0!'],
  ['lundi 9 novembre', 3000, 2500, 50, 75, 1.5, 60, '', '#DIV/0!'],
  ['Total', '#REF!', 0],
  ['après le total', 999999],
];

const parse = () =>
  parseMonthTab({
    tabName: 'Novembre',
    month: { year: 2026, month: 11 },
    rows: NOVEMBER,
    fetchedAt: new Date('2026-11-10T08:00:00Z'),
  }).report;

describe('parseNumber', () => {
  it('handles French formatting and sheet errors', () => {
    expect(parseNumber('1 234,50 €')).toBe(1234.5);
    expect(parseNumber('1.234,50')).toBe(1234.5);
    expect(parseNumber('12,5 %')).toBe(0.125);
    expect(parseNumber('#DIV/0!')).toBeUndefined();
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber(42)).toBe(42);
  });
});

describe('parseMonthTab', () => {
  it('reads the objective, the known columns and the days', () => {
    const report = parse();
    expect(report.monthlyObjective).toBe(60000);
    expect(report.extraColumns).toEqual([]);
    expect(report.days.map((day) => day.day)).toEqual([1, 2, 3, 4, 9]);
    expect(report.days[1]).toEqual({
      day: 2,
      revenue: 2000,
      objective: 1800,
      tickets: 40,
      items: 100,
      visitors: 200,
      extras: {},
    });
    expect(report.days[2].revenue).toBe(1500.5);
    expect(report.days[0].revenue).toBeUndefined();
  });

  it('keeps unknown columns as extras', () => {
    const rows = NOVEMBER.map((row) => [...row.slice(0, 9)]);
    rows[1].push('Retours');
    rows[3].push(3);
    const { report } = parseMonthTab({
      tabName: 'Novembre',
      month: { year: 2026, month: 11 },
      rows,
      fetchedAt: new Date(),
    });
    expect(report.extraColumns).toEqual(['Retours']);
    expect(report.days[1].extras).toEqual({ Retours: 3 });
    expect(report.days[0].extras).toEqual({ Retours: undefined });
  });

  it('has nothing to report on the expected layout', () => {
    const { issues } = parseMonthTab({
      tabName: 'Novembre',
      month: { year: 2026, month: 11 },
      rows: NOVEMBER,
      fetchedAt: new Date(),
    });
    expect(issues).toEqual([]);
  });

  it('reports missing columns and unreadable rows', () => {
    const { issues } = parseMonthTab({
      tabName: 'Novembre',
      month: { year: 2026, month: 11 },
      rows: [
        ['Date', 'CA', 'Tickets'],
        ['lundi 2 novembre', 100, 2],
        ['lundi deux', 100, 2],
        ['lundi 2 novembre', 100, 2],
      ],
      fetchedAt: new Date(),
    });
    expect(issues).toEqual([
      'Colonnes introuvables : « Objectif », « Quantités », « Passages »',
      '2 lignes ignorées (date illisible ou en double) : « lundi deux »…',
    ]);
  });

  it('fails loudly when the layout is unrecognisable', () => {
    expect(() =>
      parseMonthTab({
        tabName: 'X',
        month: { year: 2026, month: 11 },
        rows: [['a']],
        fetchedAt: new Date(),
      }),
    ).toThrow(/Date/);
  });
});

describe('KPIs', () => {
  it('computes ratios only over days that have both figures', () => {
    const totals = computeTotals(parse().days);
    expect(totals.revenue).toBe(6500.5);
    expect(totals.tickets).toBe(120);
    // Day 9 has no passages: TT = (40 + 30) / (200 + 150)
    expect(totals.tt).toBeCloseTo(0.2);
    expect(totals.pm).toBeCloseTo(6500.5 / 120);
    expect(totals.iv).toBeCloseTo(235 / 120);
    // Day 4 has an objective but no réalisé yet: it doesn't count against attainment
    expect(totals.diff).toBeCloseTo(6500.5 - 6300);
    expect(totals.attainment).toBeCloseTo(6500.5 / 6300);
    expect(totals.daysFilled).toBe(3);
  });

  it('groups by Monday-to-Sunday weeks', () => {
    const report = parse();
    expect(groupByWeek(report.month, report.days).map(({ from, to }) => [from, to])).toEqual([
      [1, 1],
      [2, 4],
      [9, 9],
    ]);
  });

  it('summarizes the month against the header objective', () => {
    const summary = summarizeMonth(parse());
    expect(summary.monthObjective).toBe(60000);
    expect(summary.monthAttainment).toBeCloseTo(6500.5 / 60000);
    expect(summary.bestDay?.day).toBe(9);
    expect(summary.lastFilledDay).toBe(9);
    expect(summary.landing).toBeCloseTo((6500.5 / 6300) * 60000);
  });
});
