import type { Store } from '@/lib/schemas/database/store';
import { getSessionUser, type SessionUser } from '@/lib/session';
import { accountLoginUrl, storeSettingsPath } from '@/lib/urls';
import { redirect } from 'next/navigation';
import { getStoreByOwner } from './stores';

/** For pages behind login: sends anonymous visitors to the login page (and back here afterwards). */
export const requireUser = async (returnTo: `/${string}`): Promise<SessionUser> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    redirect(`${accountLoginUrl()}?redirectTo=${encodeURIComponent(returnTo)}`);
  }
  return sessionUser;
};

/** For pages showing a store's figures: also sends users without a store to set one up. */
export const requireStore = async (
  returnTo: `/${string}`,
): Promise<{ user: SessionUser; store: Store }> => {
  const user = await requireUser(returnTo);
  const store = await getStoreByOwner(user.id);
  if (store === undefined) {
    redirect(storeSettingsPath());
  }
  return { user, store };
};

/** For server actions: the caller's store, or an error (actions can't redirect to login). */
export const currentStore = async (): Promise<Store> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    throw new Error('Unauthorized');
  }
  const store = await getStoreByOwner(sessionUser.id);
  if (store === undefined) {
    throw new Error('No store');
  }
  return store;
};
