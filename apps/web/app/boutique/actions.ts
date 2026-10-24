'use server';

import type { StoreFormState } from '@/components/store/StoreForm';
import { sheetCacheTag } from '@/lib/server/report';
import { parseStoreForm } from '@/lib/server/storeForm';
import { SheetAlreadyClaimedError, createStore } from '@/lib/server/stores';
import { getSessionUser } from '@/lib/session';
import { storePath } from '@/lib/urls';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

/** Creates a new store for the signed-in user. */
export const createStoreSettings = async (
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    return { error: 'Votre session a expiré, reconnectez-vous.' };
  }

  const parsed = await parseStoreForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  let slug: string;
  try {
    const store = await createStore(sessionUser.id, parsed);
    updateTag(sheetCacheTag(store.id));
    slug = store.slug;
  } catch (error) {
    if (error instanceof SheetAlreadyClaimedError) {
      return { error: 'Ce classeur est déjà relié à une autre boutique.' };
    }
    throw error;
  }

  redirect(storePath(slug));
};
