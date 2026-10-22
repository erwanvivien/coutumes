'use server';

import { currentStore } from '@/lib/server/access';
import { sheetCacheTag } from '@/lib/server/report';
import { updateTag } from 'next/cache';

/** "Rafraîchir": drops the store's cached sheet so the next render reads Google Sheets again. */
export const refreshSheet = async (): Promise<void> => {
  const store = await currentStore();
  updateTag(sheetCacheTag(store.id));
};
