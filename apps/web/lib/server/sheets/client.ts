import type { Cell } from '@/lib/report/sheetParser';
import { demoTabNames, demoTabs } from './demo';
import { getAccessToken, type ServiceAccount } from './googleAuth';

const API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Wide enough for the day table plus a few extra columns; the parser stops at the first empty header
const TAB_RANGE = 'A1:Z80';

/** Where a store's figures come from. */
export type SheetSource = { kind: 'google'; spreadsheetId: string } | { kind: 'demo' };

/** The store hasn't linked a sheet yet. */
export class SheetNotConfiguredError extends Error {
  constructor() {
    super('This store has no Google Sheet linked yet');
  }
}

/** The app itself is missing its service account (GOOGLE_SERVICE_ACCOUNT_*). */
export class ServiceAccountMissingError extends Error {
  constructor() {
    super('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are not set');
  }
}

/** Google refused or couldn't find the sheet — usually it isn't shared with the service account. */
export class SheetAccessError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** The email each store owner shares their sheet with (read-only). */
export const serviceAccountEmail = (): string | undefined =>
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || undefined;

const serviceAccount = (): ServiceAccount => {
  const email = serviceAccountEmail();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || undefined;
  if (email === undefined || privateKey === undefined) {
    throw new ServiceAccountMissingError();
  }
  // .env files usually hold the key on one line with literal "\n"
  return { email, privateKey: privateKey.replace(/\\n/g, '\n') };
};

const sheetsFetch = async <T>(spreadsheetId: string, path: string): Promise<T> => {
  const token = await getAccessToken(serviceAccount());
  const response = await fetch(`${API_URL}/${encodeURIComponent(spreadsheetId)}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.status === 403 || response.status === 404) {
    throw new SheetAccessError(response.status, await response.text());
  }
  if (!response.ok) {
    throw new Error(`Google Sheets request failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as T;
};

/** Tab titles, in the order they appear in the spreadsheet. */
export const fetchTabNames = async (source: SheetSource): Promise<string[]> => {
  if (source.kind === 'demo') {
    return demoTabNames();
  }

  const body = await sheetsFetch<{ sheets: { properties: { title: string } }[] }>(
    source.spreadsheetId,
    '?fields=sheets.properties.title',
  );
  return body.sheets.map((sheet) => sheet.properties.title);
};

/** Raw cell grids for several tabs in one request. Numbers come back unformatted, dates as the
 * text shown in the sheet ("lundi 2 novembre"). */
export const fetchTabs = async (
  source: SheetSource,
  tabNames: string[],
): Promise<Map<string, Cell[][]>> => {
  if (source.kind === 'demo') {
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
    source.spreadsheetId,
    `/values:batchGet?${params.toString()}`,
  );
  return new Map(tabNames.map((tabName, index) => [tabName, body.valueRanges[index].values ?? []]));
};
