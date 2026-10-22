import { describe, expect, it } from 'vitest';
import type { Cell } from './sheetParser';
import { readSheet } from './sheetReader';

const GOOD: Cell[][] = [
  ['Date', 'Réalisé', 'Objectif', 'Tickets', 'Quantités', 'Passages'],
  ['lundi 2 novembre', 100, 90, 2, 3, 10],
];

const read = (tabs: Record<string, Cell[][]>) =>
  readSheet({
    tabNames: Object.keys(tabs),
    grids: new Map(Object.entries(tabs)),
    fallbackYear: 2026,
    fetchedAt: new Date('2026-11-03T00:00:00Z'),
  });

describe('readSheet', () => {
  it('lists every tab with its status, and only uses the readable months', () => {
    const { reports, tabs } = read({
      Novembre: GOOD,
      'Novembre (copie)': GOOD,
      Décembre: [
        ['Date', 'CA'],
        ['mardi 1 décembre', 50],
      ],
      Récap: [['n’importe quoi']],
      'Janvier 27': [['pas de tableau']],
    });

    expect(tabs).toEqual([
      { tabName: 'Novembre', status: 'ok', month: { year: 2026, month: 11 }, issues: [] },
      {
        tabName: 'Novembre (copie)',
        status: 'invalid',
        issues: ['Le nom de l’onglet n’est pas un mois (ex. « Novembre » ou « Janvier 27 »)'],
      },
      {
        tabName: 'Décembre',
        status: 'warning',
        month: { year: 2026, month: 12 },
        issues: ['Colonnes introuvables : « Objectif », « Tickets », « Quantités », « Passages »'],
      },
      {
        tabName: 'Récap',
        status: 'invalid',
        issues: ['Le nom de l’onglet n’est pas un mois (ex. « Novembre » ou « Janvier 27 »)'],
      },
      {
        tabName: 'Janvier 27',
        status: 'invalid',
        month: { year: 2027, month: 1 },
        issues: ['Aucune ligne d’en-tête commençant par « Date »'],
      },
    ]);
    expect(reports.map(({ tabName }) => tabName)).toEqual(['Novembre', 'Décembre']);
  });

  it('flags a second tab for the same month', () => {
    const { tabs } = read({ Novembre: GOOD, 'Nov 26': GOOD });
    expect(tabs[1]).toEqual({
      tabName: 'Nov 26',
      status: 'invalid',
      month: { year: 2026, month: 11 },
      issues: ['Novembre 2026 est déjà lu depuis l’onglet « Novembre »'],
    });
  });
});
