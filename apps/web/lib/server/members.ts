import { storeRoleSchema, type StoreRole } from '@/lib/schemas/database/storeOwner';
import { Prisma } from '@/prisma/generated/client';
import { prismaClient } from './db';

/** Someone who has access to a store, as listed on its settings page. */
export type StoreMember = {
  userId: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: StoreRole;
  /** The store's creator (or whoever they handed it to): can't be removed or demoted. */
  isSuperAdmin: boolean;
};

/** Already has access to this store. */
export class AlreadyMemberError extends Error {
  constructor() {
    super('This user already has access to the store');
  }
}

/** The super admin can't be removed, demoted, or replaced by anyone but themselves. */
export class SuperAdminProtectedError extends Error {
  constructor() {
    super('The super admin of a store cannot be changed this way');
  }
}

/** Not (or no longer) a member of this store. */
export class NotMemberError extends Error {
  constructor() {
    super('This user has no access to the store');
  }
}

/** The caller's role in this store, or undefined if they have no access to it. */
export const getMemberRole = async (
  userId: string,
  storeId: string,
): Promise<StoreRole | undefined> => {
  const row = await prismaClient.storeOwner.findUnique({
    where: { storeId_userId: { storeId, userId } },
    select: { role: true },
  });
  return row === null ? undefined : storeRoleSchema.parse(row.role);
};

/** Everyone with access to the store: the super admin first, then admins, then staff. */
export const listMembers = async (storeId: string): Promise<StoreMember[]> => {
  const store = await prismaClient.store.findUniqueOrThrow({
    where: { id: storeId },
    select: {
      superAdminId: true,
      Owners: { include: { User: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  const members = store.Owners.map(
    (owner): StoreMember => ({
      userId: owner.userId,
      name: owner.User.name,
      email: owner.User.email,
      imageUrl: owner.User.imageUrl ?? undefined,
      role: storeRoleSchema.parse(owner.role),
      isSuperAdmin: owner.userId === store.superAdminId,
    }),
  );
  const rank = (member: StoreMember): number => {
    if (member.isSuperAdmin) {
      return 0;
    }
    return member.role === 'admin' ? 1 : 2;
  };
  return members.sort((a, b) => rank(a) - rank(b));
};

/**
 * Gives someone access by their Google email. They may not have signed in yet: their account is
 * created now, and their first Google sign-in with that address lands on it.
 */
export const addMember = async (storeId: string, email: string, role: StoreRole): Promise<void> => {
  const user = await prismaClient.user.upsert({
    where: { email },
    create: { email, name: email.split('@')[0] },
    update: {},
  });
  try {
    await prismaClient.storeOwner.create({ data: { storeId, userId: user.id, role } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AlreadyMemberError();
    }
    throw error;
  }
};

const assertNotSuperAdmin = async (storeId: string, userId: string): Promise<void> => {
  const store = await prismaClient.store.findUniqueOrThrow({
    where: { id: storeId },
    select: { superAdminId: true },
  });
  if (store.superAdminId === userId) {
    throw new SuperAdminProtectedError();
  }
};

export const setMemberRole = async (
  storeId: string,
  userId: string,
  role: StoreRole,
): Promise<void> => {
  await assertNotSuperAdmin(storeId, userId);
  const { count } = await prismaClient.storeOwner.updateMany({
    where: { storeId, userId },
    data: { role },
  });
  if (count === 0) {
    throw new NotMemberError();
  }
};

export const removeMember = async (storeId: string, userId: string): Promise<void> => {
  await assertNotSuperAdmin(storeId, userId);
  const { count } = await prismaClient.storeOwner.deleteMany({ where: { storeId, userId } });
  if (count === 0) {
    throw new NotMemberError();
  }
};

/**
 * Hands the store over to another member, who becomes its super admin (and an admin, if they
 * weren't). Only the current super admin may do this; they stay on as an admin.
 */
export const transferOwnership = async (
  storeId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> => {
  await prismaClient.$transaction(async (tx) => {
    const { count } = await tx.store.updateMany({
      where: { id: storeId, superAdminId: fromUserId },
      data: { superAdminId: toUserId },
    });
    if (count === 0) {
      throw new SuperAdminProtectedError();
    }
    const promoted = await tx.storeOwner.updateMany({
      where: { storeId, userId: toUserId },
      data: { role: 'admin' },
    });
    if (promoted.count === 0) {
      throw new NotMemberError();
    }
  });
};

/** Deletes the store with its presentations and memberships (share links stop working). */
export const deleteStore = async (storeId: string): Promise<void> => {
  await prismaClient.store.delete({ where: { id: storeId } });
};
