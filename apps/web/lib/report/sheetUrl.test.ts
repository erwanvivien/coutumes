import { describe, expect, it } from 'vitest';
import { parseSheetId } from './sheetUrl';

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-abcd';

describe('parseSheetId', () => {
  it('reads the id from any sheet URL', () => {
    expect(parseSheetId(`https://docs.google.com/spreadsheets/d/${ID}/edit#gid=0`)).toBe(ID);
    expect(parseSheetId(`  https://docs.google.com/spreadsheets/d/${ID}  `)).toBe(ID);
  });

  it('accepts a bare id', () => {
    expect(parseSheetId(ID)).toBe(ID);
  });

  it('rejects anything else', () => {
    expect(parseSheetId('https://example.com')).toBeUndefined();
    expect(parseSheetId('Novembre')).toBeUndefined();
  });
});
