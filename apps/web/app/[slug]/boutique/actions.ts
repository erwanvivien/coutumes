'use server';

import type { StoreFormState } from '@/components/store/StoreForm';
import { sheetCacheTag } from '@/lib/server/report';
import { parseStoreForm } from '@/lib/server/storeForm';
import { getStoreBySlug, SheetAlreadyClaimedError, updateStore } from '@/lib/server/stores';
import { getSessionUser } from '@/lib/session';
import { storePath } from '@/lib/urls';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

/** Updates the store at this slug, scoped to a user who actually owns it. */
export const updateStoreSettings = async (
  slug: string,
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    return { error: 'Votre session a expiré, reconnectez-vous.' };
  }

  const store = await getStoreBySlug(sessionUser.id, slug);
  if (store === undefined) {
    return { error: 'Boutique introuvable.' };
  }

  const parsed = await parseStoreForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    const updated = await updateStore(sessionUser.id, store.id, parsed);
    updateTag(sheetCacheTag(updated.id));
  } catch (error) {
    if (error instanceof SheetAlreadyClaimedError) {
      return { error: 'Ce classeur est déjà relié à une autre boutique.' };
    }
    throw error;
  }

  redirect(storePath(slug));
};
