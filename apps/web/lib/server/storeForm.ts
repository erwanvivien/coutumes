import { parseSheetId } from '@/lib/report/sheetUrl';
import { storeNameSchema } from '@/lib/schemas/database/store';
import {
  fetchTabNames,
  ServiceAccountMissingError,
  SheetAccessError,
  serviceAccountEmail,
} from './sheets/client';

export type ParsedStoreForm =
  { ok: true; name: string; sheetId?: string; useDemoData: boolean } | { ok: false; error: string };

/** Validates the store settings form, checking the sheet is actually readable before saving. */
export const parseStoreForm = async (formData: FormData): Promise<ParsedStoreForm> => {
  const name = storeNameSchema.safeParse(formData.get('name'));
  if (!name.success) {
    return { ok: false, error: name.error.issues[0].message };
  }

  const useDemoData = formData.get('useDemoData') === 'on';
  const rawSheet = formData.get('sheet');
  const sheetInput = typeof rawSheet === 'string' ? rawSheet.trim() : '';
  const sheetId = sheetInput === '' ? undefined : parseSheetId(sheetInput);
  if (sheetInput !== '' && sheetId === undefined) {
    return { ok: false, error: 'Ce lien ne ressemble pas à un lien Google Sheets.' };
  }
  if (sheetId === undefined && !useDemoData) {
    return {
      ok: false,
      error: 'Collez le lien du Google Sheet, ou utilisez les données de démonstration.',
    };
  }

  // Check access now, so a forgotten "Partager" shows up here and not on the dashboard
  if (sheetId !== undefined && !useDemoData) {
    try {
      await fetchTabNames({ kind: 'google', spreadsheetId: sheetId });
    } catch (error) {
      if (error instanceof SheetAccessError) {
        return {
          ok: false,
          error: `Le classeur n’est pas accessible. Partagez-le (Lecteur) avec ${serviceAccountEmail() ?? 'le compte de service'} puis réessayez.`,
        };
      }
      if (error instanceof ServiceAccountMissingError) {
        return {
          ok: false,
          error:
            'L’application n’a pas de compte de service Google configuré : utilisez les données de démonstration pour l’instant.',
        };
      }
      throw error;
    }
  }

  return { ok: true, name: name.data, sheetId, useDemoData };
};
