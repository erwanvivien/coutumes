/** Accepts a full Google Sheets URL or a bare spreadsheet id, returns the id. */
export const parseSheetId = (input: string): string | undefined => {
  const trimmed = input.trim();
  const fromUrl = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(trimmed);
  if (fromUrl !== null) {
    return fromUrl[1];
  }
  return /^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : undefined;
};

export const sheetUrl = (sheetId: string): string =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
