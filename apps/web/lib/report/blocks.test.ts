import { describe, expect, it } from 'vitest';
import { defaultBlocks, parseInline, parseParagraphs } from './blocks';

describe('parseInline', () => {
  it('splits bold segments', () => {
    expect(parseInline('Un **très bon** mois, **+8 %**.')).toEqual([
      { text: 'Un ', bold: false },
      { text: 'très bon', bold: true },
      { text: ' mois, ', bold: false },
      { text: '+8 %', bold: true },
      { text: '.', bold: false },
    ]);
  });

  it('keeps unmatched markers as text', () => {
    expect(parseInline('a ** b')).toEqual([{ text: 'a ** b', bold: false }]);
  });
});

describe('parseParagraphs', () => {
  it('groups "- " lines into lists', () => {
    expect(
      parseParagraphs('Semaine en repli :\n- samedi quasi nul\n• dimanche fermé\n\nMerci'),
    ).toEqual([
      { kind: 'line', text: 'Semaine en repli :' },
      { kind: 'list', items: ['samedi quasi nul', 'dimanche fermé'] },
      { kind: 'line', text: '' },
      { kind: 'line', text: 'Merci' },
    ]);
  });

  it('leaves negative figures alone', () => {
    expect(parseParagraphs('-25 % vs S-1')).toEqual([{ kind: 'line', text: '-25 % vs S-1' }]);
  });
});

describe('defaultBlocks', () => {
  it('starts a week with the recap headings', () => {
    const blocks = defaultBlocks('week');
    expect(blocks[0].type).toBe('week-recap');
    expect(blocks.filter((block) => block.type === 'heading').map((block) => block.text)).toEqual([
      'Performances quantis – Semaine',
      'Performances qualis – Semaine',
      'Auto-évaluation et tâches annexes',
      'To do semaine à venir',
      'Commentaires',
    ]);
  });
});
