import { parseSheetId } from '@/lib/report/sheetUrl';
import {
  revenueBasisSchema,
  storeNameSchema,
  type RevenueBasis,
} from '@/lib/schemas/database/store';
import {
  fetchTabNames,
  ServiceAccountMissingError,
  SheetAccessError,
  serviceAccountEmail,
} from './sheets/client';

export type ParsedStoreForm =
  | {
      ok: true;
      name: string;
      sheetId?: string;
      useDemoData: boolean;
      vatRate: number;
      revenueBasis: RevenueBasis;
    }
  | { ok: false; error: string };

/** Validates the store settings form, checking the sheet is actually readable before saving. */
export const parseStoreForm = async (formData: FormData): Promise<ParsedStoreForm> => {
  const name = storeNameSchema.safeParse(formData.get('name'));
  if (!name.success) {
    return { ok: false, error: name.error.issues[0].message };
  }

  const revenueBasis = revenueBasisSchema.safeParse(formData.get('revenueBasis'));
  if (!revenueBasis.success) {
    return { ok: false, error: 'Indiquez si les chiffres saisis sont HT ou TTC.' };
  }

  const vatRatePercent = Number(formData.get('vatRate'));
  if (!Number.isFinite(vatRatePercent) || vatRatePercent < 0 || vatRatePercent > 100) {
    return { ok: false, error: 'Le taux de TVA doit être compris entre 0 et 100 %.' };
  }
  const vatRate = vatRatePercent / 100;

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

  return {
    ok: true,
    name: name.data,
    sheetId,
    useDemoData,
    vatRate,
    revenueBasis: revenueBasis.data,
  };
};
