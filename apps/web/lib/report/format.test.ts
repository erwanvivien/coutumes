import { describe, expect, it } from 'vitest';
import { formatOneDecimal, formatSignedPercent, formatSignedPoints } from './format';

// Intl uses narrow no-break spaces; compare on plain spaces
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('recap formats', () => {
  it('signs changes with a real minus', () => {
    expect(plain(formatSignedPercent(-0.25))).toBe('−25 %');
    expect(plain(formatSignedPercent(0.12))).toBe('+12 %');
    expect(formatSignedPercent(undefined)).toBe('—');
  });

  it('gives rate changes in points', () => {
    expect(formatSignedPoints(0.03)).toBe('+3 pts');
    expect(formatSignedPoints(-0.01)).toBe('−1 pt');
    expect(formatSignedPoints(0.004)).toBe('+0,4 pt');
  });

  it('keeps one decimal for daily averages', () => {
    expect(formatOneDecimal(24.666)).toBe('24,7');
    expect(formatOneDecimal(16)).toBe('16');
  });
});
