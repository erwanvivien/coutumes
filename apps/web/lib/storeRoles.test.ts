import { describe, expect, it } from 'vitest';
import { canDeleteStore, memberPermissions, type Viewer } from './storeRoles';

const superAdmin: Viewer = { userId: 'owner', role: 'admin', isSuperAdmin: true };
const admin: Viewer = { userId: 'admin', role: 'admin', isSuperAdmin: false };
const otherAdmin: Viewer = { userId: 'admin-2', role: 'admin', isSuperAdmin: false };
const staff: Viewer = { userId: 'staff', role: 'staff', isSuperAdmin: false };
const otherStaff: Viewer = { userId: 'staff-2', role: 'staff', isSuperAdmin: false };

const all = { canChangeRole: true, canRemove: true };
const none = { canChangeRole: false, canRemove: false };

describe('memberPermissions', () => {
  it('lets admins promote and remove staff', () => {
    expect(memberPermissions(admin, staff)).toEqual(all);
    expect(memberPermissions(superAdmin, staff)).toEqual(all);
  });

  it('keeps admins for the super admin to demote or remove', () => {
    expect(memberPermissions(admin, otherAdmin)).toEqual(none);
    expect(memberPermissions(superAdmin, admin)).toEqual(all);
  });

  it('never touches the super admin or the viewer themselves', () => {
    expect(memberPermissions(admin, superAdmin)).toEqual(none);
    expect(memberPermissions(admin, admin)).toEqual(none);
    expect(memberPermissions(superAdmin, superAdmin)).toEqual(none);
  });

  it('gives staff no say over anyone', () => {
    expect(memberPermissions(staff, otherStaff)).toEqual(none);
  });
});

describe('canDeleteStore', () => {
  it('is reserved to the super admin', () => {
    expect(canDeleteStore(superAdmin)).toBe(true);
    expect(canDeleteStore(admin)).toBe(false);
  });
});
