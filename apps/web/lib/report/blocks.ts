/** The building blocks of a presentation. Text blocks hold what he writes; the others render a
 * piece of the month's data. */
export type Block =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'kpis' }
  | { id: string; type: 'daily-chart' }
  | { id: string; type: 'cumulative-chart' }
  | { id: string; type: 'weekly-table' }
  | { id: string; type: 'daily-table' }
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
  'page-break': 'Saut de page',
};

export const newBlock = (type: BlockType): Block => {
  const id = crypto.randomUUID();
  return type === 'heading' || type === 'text' ? { id, type, text: '' } : { id, type };
};

/** What a fresh presentation starts with: one theme per printed page, each with room for a
 * comment (empty text blocks don't show in the PDF or on the share link). */
export const defaultBlocks = (): Block[] =>
  (
    [
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
    ] as const
  ).map(([type, text]) => {
    const block = newBlock(type);
    return text !== undefined && 'text' in block ? { ...block, text } : block;
  });

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
