import type { StoreRole } from './schemas/database/storeOwner';

export type Viewer = { userId: string; role: StoreRole; isSuperAdmin: boolean };
export type Target = { userId: string; role: StoreRole; isSuperAdmin: boolean };

/**
 * What the viewer may do to another member of the store: admins promote and remove staff, only
 * the super admin demotes or removes admins, and nobody touches the super admin or themselves.
 */
export const memberPermissions = (
  viewer: Viewer,
  target: Target,
): { canChangeRole: boolean; canRemove: boolean } => {
  if (viewer.role !== 'admin' || target.isSuperAdmin || target.userId === viewer.userId) {
    return { canChangeRole: false, canRemove: false };
  }
  const allowed = target.role === 'staff' || viewer.isSuperAdmin;
  return { canChangeRole: allowed, canRemove: allowed };
};

/** Only the super admin can delete the store. */
export const canDeleteStore = (viewer: Viewer): boolean => viewer.isSuperAdmin;
