'use server';

import type { StoreFormState } from '@/components/store/StoreForm';
import { toPathname } from '@/lib';
import { storeRoleSchema } from '@/lib/schemas/database/storeOwner';
import { emailSchema } from '@/lib/schemas/utils';
import { adminStore } from '@/lib/server/access';
import {
  addMember,
  AlreadyMemberError,
  deleteStore,
  getMemberRole,
  NotMemberError,
  removeMember,
  setMemberRole,
  SuperAdminProtectedError,
  transferOwnership,
} from '@/lib/server/members';
import { sheetCacheTag } from '@/lib/server/report';
import { parseStoreForm } from '@/lib/server/storeForm';
import { SheetAlreadyClaimedError, updateStore } from '@/lib/server/stores';
import { canDeleteStore, memberPermissions } from '@/lib/storeRoles';
import { homePath, storePath, storeSettingsPath } from '@/lib/urls';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

/** Updates the store at this slug; only its admins can. */
export const updateStoreSettings = async (
  slug: string,
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const access = await adminStore(slug);
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = await parseStoreForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    const updated = await updateStore(access.user.id, access.store.id, parsed);
    updateTag(sheetCacheTag(updated.id));
  } catch (error) {
    if (error instanceof SheetAlreadyClaimedError) {
      return { error: 'Ce classeur est déjà relié à une autre boutique.' };
    }
    throw error;
  }

  redirect(storePath(slug));
};

/** Turns the errors a membership change can hit into a message for the form. */
const membershipError = (error: unknown): StoreFormState => {
  if (error instanceof AlreadyMemberError) {
    return { error: 'Cette personne a déjà accès à la boutique.' };
  }
  if (error instanceof SuperAdminProtectedError) {
    return { error: 'Le propriétaire de la boutique ne peut pas être retiré ni rétrogradé.' };
  }
  if (error instanceof NotMemberError) {
    return { error: 'Cette personne n’a plus accès à la boutique.' };
  }
  throw error;
};

/** Gives someone access to the store by their Google email. */
export const addStoreMember = async (
  slug: string,
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const access = await adminStore(slug);
  if (!access.ok) {
    return { error: access.error };
  }
  const email = emailSchema.safeParse(formData.get('email'));
  if (!email.success) {
    return { error: 'Cette adresse email n’est pas valide.' };
  }
  const role = storeRoleSchema.safeParse(formData.get('role'));
  if (!role.success) {
    return { error: 'Choisissez un rôle.' };
  }

  try {
    await addMember(access.store.id, email.data, role.data);
  } catch (error) {
    return membershipError(error);
  }
  revalidatePath(toPathname(storeSettingsPath(slug)));
  return {};
};

/** What the calling admin may do to this member, or undefined if they have no access anymore. */
const permissionsOver = async (
  access: { user: { id: string }; store: { id: string; superAdminId: string } },
  userId: string,
): Promise<ReturnType<typeof memberPermissions> | undefined> => {
  const role = await getMemberRole(userId, access.store.id);
  if (role === undefined) {
    return undefined;
  }
  return memberPermissions(
    {
      userId: access.user.id,
      role: 'admin',
      isSuperAdmin: access.store.superAdminId === access.user.id,
    },
    { userId, role, isSuperAdmin: access.store.superAdminId === userId },
  );
};

export const changeStoreMemberRole = async (
  slug: string,
  userId: string,
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const access = await adminStore(slug);
  if (!access.ok) {
    return { error: access.error };
  }
  const permissions = await permissionsOver(access, userId);
  if (permissions === undefined) {
    return { error: 'Cette personne n’a plus accès à la boutique.' };
  }
  if (!permissions.canChangeRole) {
    return { error: 'Seul le propriétaire de la boutique peut rétrograder un administrateur.' };
  }
  const role = storeRoleSchema.safeParse(formData.get('role'));
  if (!role.success) {
    return { error: 'Choisissez un rôle.' };
  }

  try {
    await setMemberRole(access.store.id, userId, role.data);
  } catch (error) {
    return membershipError(error);
  }
  revalidatePath(toPathname(storeSettingsPath(slug)));
  return {};
};

export const removeStoreMember = async (
  slug: string,
  userId: string,
  _previous: StoreFormState,
  _formData: FormData,
): Promise<StoreFormState> => {
  const access = await adminStore(slug);
  if (!access.ok) {
    return { error: access.error };
  }
  const permissions = await permissionsOver(access, userId);
  if (permissions === undefined) {
    return { error: 'Cette personne n’a plus accès à la boutique.' };
  }
  if (!permissions.canRemove) {
    return { error: 'Seul le propriétaire de la boutique peut retirer un administrateur.' };
  }

  try {
    await removeMember(access.store.id, userId);
  } catch (error) {
    return membershipError(error);
  }
  revalidatePath(toPathname(storeSettingsPath(slug)));
  return {};
};

/** Hands the store over to another member; only its current super admin can. */
export const transferStoreOwnership = async (
  slug: string,
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const access = await adminStore(slug);
  if (!access.ok) {
    return { error: access.error };
  }
  if (access.store.superAdminId !== access.user.id) {
    return { error: 'Seul le propriétaire de la boutique peut la transférer.' };
  }
  const toUserId = formData.get('userId');
  if (typeof toUserId !== 'string' || toUserId === '' || toUserId === access.user.id) {
    return { error: 'Choisissez à qui transférer la boutique.' };
  }

  try {
    await transferOwnership(access.store.id, access.user.id, toUserId);
  } catch (error) {
    return membershipError(error);
  }
  revalidatePath(toPathname(storeSettingsPath(slug)));
  return {};
};

/** Deletes the store for everyone, once its name has been typed back; only its super admin can. */
export const deleteStoreAction = async (
  slug: string,
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> => {
  const access = await adminStore(slug);
  if (!access.ok) {
    return { error: access.error };
  }
  const isSuperAdmin = access.store.superAdminId === access.user.id;
  if (!canDeleteStore({ userId: access.user.id, role: 'admin', isSuperAdmin })) {
    return { error: 'Seul le propriétaire de la boutique peut la supprimer.' };
  }
  const confirmation = formData.get('confirmation');
  if (typeof confirmation !== 'string' || confirmation.trim() !== access.store.name) {
    return { error: 'Tapez le nom exact de la boutique pour confirmer.' };
  }

  await deleteStore(access.store.id);
  updateTag(sheetCacheTag(access.store.id));
  redirect(homePath());
};
