import { describe, expect, it } from 'vitest';
import { parseInline } from './blocks';

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
