import type { Cell } from '@/lib/report/sheetParser';
import { demoTabNames, demoTabs } from './demo';
import { getAccessToken, type ServiceAccount } from './googleAuth';

const API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Wide enough for the day table plus a few extra columns; the parser stops at the first empty header
const TAB_RANGE = 'A1:Z80';

export type SheetConfig =
  { kind: 'google'; spreadsheetId: string; account: ServiceAccount } | { kind: 'demo' };

export class SheetNotConfiguredError extends Error {
  constructor() {
    super('Google Sheet is not configured (GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_*)');
  }
}

export const getSheetConfig = (): SheetConfig => {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || undefined;
  if (spreadsheetId === 'demo') {
    return { kind: 'demo' };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || undefined;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || undefined;
  if (spreadsheetId === undefined || email === undefined || privateKey === undefined) {
    throw new SheetNotConfiguredError();
  }

  // .env files usually hold the key on one line with literal "\n"
  return {
    kind: 'google',
    spreadsheetId,
    account: { email, privateKey: privateKey.replace(/\\n/g, '\n') },
  };
};

const sheetsFetch = async <T>(
  config: Extract<SheetConfig, { kind: 'google' }>,
  path: string,
): Promise<T> => {
  const token = await getAccessToken(config.account);
  const response = await fetch(`${API_URL}/${config.spreadsheetId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Google Sheets request failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as T;
};

/** Tab titles, in the order they appear in the spreadsheet. */
export const fetchTabNames = async (config: SheetConfig): Promise<string[]> => {
  if (config.kind === 'demo') {
    return demoTabNames();
  }

  const body = await sheetsFetch<{ sheets: { properties: { title: string } }[] }>(
    config,
    '?fields=sheets.properties.title',
  );
  return body.sheets.map((sheet) => sheet.properties.title);
};

/** Raw cell grids for several tabs in one request. Numbers come back unformatted, dates as the
 * text shown in the sheet ("lundi 2 novembre"). */
export const fetchTabs = async (
  config: SheetConfig,
  tabNames: string[],
): Promise<Map<string, Cell[][]>> => {
  if (config.kind === 'demo') {
    return demoTabs(tabNames);
  }
  if (tabNames.length === 0) {
    return new Map();
  }

  const params = new URLSearchParams({
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });
  for (const tabName of tabNames) {
    params.append('ranges', `'${tabName.replace(/'/g, "''")}'!${TAB_RANGE}`);
  }

  const body = await sheetsFetch<{ valueRanges: { values?: Cell[][] }[] }>(
    config,
    `/values:batchGet?${params.toString()}`,
  );
  return new Map(tabNames.map((tabName, index) => [tabName, body.valueRanges[index].values ?? []]));
};
