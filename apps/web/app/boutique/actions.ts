'use server';

import { parseSheetId } from '@/lib/report/sheetUrl';
import { storeNameSchema } from '@/lib/schemas/database/store';
import { sheetCacheTag } from '@/lib/server/report';
import {
  fetchTabNames,
  ServiceAccountMissingError,
  SheetAccessError,
  serviceAccountEmail,
} from '@/lib/server/sheets/client';
import { SheetAlreadyClaimedError, saveStore } from '@/lib/server/stores';
import { getSessionUser } from '@/lib/session';
import { homePath } from '@/lib/urls';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export type StoreFormState = { error?: string };

/** Creates or updates the signed-in user's store, checking the sheet is readable first. */
export const saveStoreSettings = async (
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    return { error: 'Votre session a expiré, reconnectez-vous.' };
  }

  const name = storeNameSchema.safeParse(formData.get('name'));
  if (!name.success) {
    return { error: name.error.issues[0].message };
  }

  const useDemoData = formData.get('useDemoData') === 'on';
  const rawSheet = formData.get('sheet');
  const sheetInput = typeof rawSheet === 'string' ? rawSheet.trim() : '';
  const sheetId = sheetInput === '' ? undefined : parseSheetId(sheetInput);
  if (sheetInput !== '' && sheetId === undefined) {
    return { error: 'Ce lien ne ressemble pas à un lien Google Sheets.' };
  }
  if (sheetId === undefined && !useDemoData) {
    return { error: 'Collez le lien du Google Sheet, ou utilisez les données de démonstration.' };
  }

  // Check access now, so a forgotten "Partager" shows up here and not on the dashboard
  if (sheetId !== undefined && !useDemoData) {
    try {
      await fetchTabNames({ kind: 'google', spreadsheetId: sheetId });
    } catch (error) {
      if (error instanceof SheetAccessError) {
        return {
          error: `Le classeur n’est pas accessible. Partagez-le (Lecteur) avec ${serviceAccountEmail() ?? 'le compte de service'} puis réessayez.`,
        };
      }
      if (error instanceof ServiceAccountMissingError) {
        return {
          error:
            'L’application n’a pas de compte de service Google configuré : utilisez les données de démonstration pour l’instant.',
        };
      }
      throw error;
    }
  }

  try {
    const store = await saveStore(sessionUser.id, { name: name.data, sheetId, useDemoData });
    updateTag(sheetCacheTag(store.id));
  } catch (error) {
    if (error instanceof SheetAlreadyClaimedError) {
      return { error: 'Ce classeur est déjà relié à une autre boutique.' };
    }
    throw error;
  }

  redirect(homePath());
};
