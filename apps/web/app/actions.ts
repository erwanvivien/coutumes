'use server';

import { getSessionUser } from '@/lib/session';
import { isAllowedEmail } from '@/lib/server/auth/allowlist';
import { SHEET_CACHE_TAG } from '@/lib/server/report';
import { updateTag } from 'next/cache';

/** "Rafraîchir": drops the cached sheet so the next render reads Google Sheets again. */
export const refreshSheet = async (): Promise<void> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined || !isAllowedEmail(sessionUser.email)) {
    throw new Error('Unauthorized');
  }
  updateTag(SHEET_CACHE_TAG);
};
