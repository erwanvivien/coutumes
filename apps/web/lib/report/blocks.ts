/** The building blocks of a presentation. Text blocks hold what he writes; the others render a
 * piece of the period's data (`week-*` blocks belong to weekly recaps, the others to months). */
export type Block =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'kpis' }
  | { id: string; type: 'daily-chart' }
  | { id: string; type: 'cumulative-chart' }
  | { id: string; type: 'weekly-table' }
  | { id: string; type: 'daily-table' }
  | { id: string; type: 'week-recap' }
  | { id: string; type: 'week-chart' }
  | { id: string; type: 'week-table' }
  | { id: string; type: 'page-break' };

export type BlockType = Block['type'];

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Titre',
  text: 'Texte',
  kpis: 'Indicateurs clés',
  'daily-chart': 'CA par jour',
  'cumulative-chart': 'Progression',
  'weekly-table': 'Tableau semaines',
  'daily-table': 'Tableau jours',
  'week-recap': 'Indicateurs vs S-1',
  'week-chart': 'CA par jour vs S-1',
  'week-table': 'Tableau jours',
  'page-break': 'Saut de page',
};

/** A presentation covers a month, or a week (the store's « Récap semaine »). */
export type PeriodKind = 'month' | 'week';

/** Blocks that can be added to a presentation of that kind, in menu order */
export const ADDABLE_BLOCKS: Record<PeriodKind, BlockType[]> = {
  month: [
    'heading',
    'text',
    'kpis',
    'daily-chart',
    'cumulative-chart',
    'weekly-table',
    'daily-table',
    'page-break',
  ],
  week: ['heading', 'text', 'week-recap', 'week-chart', 'week-table', 'page-break'],
};

export const newBlock = (type: BlockType): Block => {
  const id = crypto.randomUUID();
  return type === 'heading' || type === 'text' ? { id, type, text: '' } : { id, type };
};

type BlockSeed = readonly [BlockType, string?];

const fromSeeds = (seeds: readonly BlockSeed[]): Block[] =>
  seeds.map(([type, text]) => {
    const block = newBlock(type);
    return text !== undefined && 'text' in block ? { ...block, text } : block;
  });

const WEEK_SEEDS: readonly BlockSeed[] = [
  ['week-recap'],
  ['heading', 'Performances quantis – Semaine'],
  ['text'],
  ['heading', 'Performances qualis – Semaine'],
  ['text'],
  ['page-break'],
  ['heading', 'Auto-évaluation et tâches annexes'],
  ['text'],
  ['heading', 'To do semaine à venir'],
  ['text'],
  ['heading', 'Commentaires'],
  ['text'],
];

const MONTH_SEEDS: readonly BlockSeed[] = [
  ['heading', 'Synthèse du mois'],
  ['kpis'],
  ['text'],
  ['page-break'],
  ['heading', 'Chiffre d’affaires par jour'],
  ['daily-chart'],
  ['text'],
  ['page-break'],
  ['heading', 'Progression vers l’objectif'],
  ['cumulative-chart'],
  ['text'],
  ['page-break'],
  ['heading', 'Détail par semaine'],
  ['weekly-table'],
];

/** What a fresh presentation starts with (empty text blocks don't show in the PDF or on the
 * share link).
 *
 * A month: one theme per printed page, each with room for a comment.
 * A week: the store's « Récap semaine » — indicators vs S-1, then the store manager's write-up
 * under the headings of the Word recap the store used to send. */
export const defaultBlocks = (kind: PeriodKind): Block[] =>
  kind === 'week' ? fromSeeds(WEEK_SEEDS) : fromSeeds(MONTH_SEEDS);

export type InlineSegment = { text: string; bold: boolean };

/** Splits "**gras** et normal" into segments. An unmatched ** is kept as plain text. */
export const parseInline = (text: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  const pattern = /\*\*([\s\S]+?)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), bold: false });
  }
  return segments;
};

/** A text block's paragraphs: consecutive lines starting with "- " (or "• ") form a bulleted
 * list, like the recaps typed in Word; other lines are kept as they are. */
export type Paragraph = { kind: 'line'; text: string } | { kind: 'list'; items: string[] };

export const parseParagraphs = (text: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  for (const line of text.split('\n')) {
    const bullet = /^\s*[-•–]\s+(.*)$/.exec(line);
    const last = paragraphs.at(-1);
    if (bullet === null) {
      paragraphs.push({ kind: 'line', text: line });
    } else if (last?.kind === 'list') {
      last.items.push(bullet[1]);
    } else {
      paragraphs.push({ kind: 'list', items: [bullet[1]] });
    }
  }
  return paragraphs;
};
