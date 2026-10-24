import type { Store } from '@/lib/schemas/database/store';
import { getSessionUser, type SessionUser } from '@/lib/session';
import { accountLoginUrl } from '@/lib/urls';
import { notFound, redirect } from 'next/navigation';
import { getStoreById, getStoreBySlug } from './stores';

/** For pages behind login: sends anonymous visitors to the login page (and back here afterwards). */
export const requireUser = async (returnTo: string): Promise<SessionUser> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    redirect(`${accountLoginUrl()}?redirectTo=${encodeURIComponent(returnTo)}`);
  }
  return sessionUser;
};

/** For pages under /{slug}: 404s on a slug the caller doesn't own (wrong or unknown alike). */
export const requireStore = async (
  slug: string,
  returnTo: string,
): Promise<{ user: SessionUser; store: Store }> => {
  const user = await requireUser(returnTo);
  const store = await getStoreBySlug(user.id, slug);
  if (store === undefined) {
    notFound();
  }
  return { user, store };
};

/** For server actions: the caller's store, or an error (actions can't redirect to login). */
export const currentStore = async (storeId: string): Promise<Store> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined) {
    throw new Error('Unauthorized');
  }
  const store = await getStoreById(sessionUser.id, storeId);
  if (store === undefined) {
    throw new Error('No store');
  }
  return store;
};
