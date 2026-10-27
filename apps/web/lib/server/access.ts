import type { Store } from '@/lib/schemas/database/store';
import type { StoreRole } from '@/lib/schemas/database/storeOwner';
import { getSessionUser, type SessionUser } from '@/lib/session';
import { accountLoginUrl } from '@/lib/urls';
import { notFound, redirect } from 'next/navigation';
import { getMemberRole } from './members';
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
): Promise<{ user: SessionUser; store: Store; role: StoreRole }> => {
  const user = await requireUser(returnTo);
  const store = await getStoreBySlug(user.id, slug);
  const role = store === undefined ? undefined : await getMemberRole(user.id, store.id);
  if (store === undefined || role === undefined) {
    notFound();
  }
  return { user, store, role };
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

/** For admin-only server actions under /{slug}: the caller and their store, or a French error. */
export const adminStore = async (
  slug: string,
): Promise<{ ok: true; user: SessionUser; store: Store } | { ok: false; error: string }> => {
  const user = await getSessionUser();
  if (user === undefined) {
    return { ok: false, error: 'Votre session a expiré, reconnectez-vous.' };
  }
  const store = await getStoreBySlug(user.id, slug);
  if (store === undefined) {
    return { ok: false, error: 'Boutique introuvable.' };
  }
  if ((await getMemberRole(user.id, store.id)) !== 'admin') {
    return { ok: false, error: 'Seuls les administrateurs de la boutique peuvent faire cela.' };
  }
  return { ok: true, user, store };
};
