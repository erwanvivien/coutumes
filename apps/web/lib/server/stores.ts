import { storeSchema, type RevenueBasis, type Store } from '@/lib/schemas/database/store';
import { Prisma } from '@/prisma/generated/client';
import { slugify } from '@template/shared';
import { prismaClient } from './db';
import { SheetNotConfiguredError, type SheetSource } from './sheets/client';

/** Another store already reads this sheet. */
export class SheetAlreadyClaimedError extends Error {
  constructor() {
    super('This Google Sheet is already linked to another store');
  }
}

/** Every store this user can see, oldest first (several users can share a store). */
export const getStoresByOwner = async (ownerId: string): Promise<Store[]> => {
  const rows = await prismaClient.store.findMany({
    where: { Owners: { some: { userId: ownerId } } },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => storeSchema.parse(row));
};

/** The store at this slug, scoped to a user who actually owns it (never leaks another's). */
export const getStoreBySlug = async (ownerId: string, slug: string): Promise<Store | undefined> => {
  const row = await prismaClient.store.findFirst({
    where: { slug, Owners: { some: { userId: ownerId } } },
  });
  return row === null ? undefined : storeSchema.parse(row);
};

/** Same ownership scoping as `getStoreBySlug`, by id instead (for server actions). */
export const getStoreById = async (ownerId: string, id: string): Promise<Store | undefined> => {
  const row = await prismaClient.store.findFirst({
    where: { id, Owners: { some: { userId: ownerId } } },
  });
  return row === null ? undefined : storeSchema.parse(row);
};

/** The first slug derived from `name` that nobody else is using yet. */
const freeSlug = async (base: string): Promise<string> => {
  let candidate = base;
  for (
    let suffix = 2;
    (await prismaClient.store.findUnique({ where: { slug: candidate } })) !== null;
    suffix++
  ) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
};

type StoreInput = {
  name: string;
  sheetId?: string;
  useDemoData: boolean;
  vatRate: number;
  revenueBasis: RevenueBasis;
};

export const createStore = async (ownerId: string, data: StoreInput): Promise<Store> => {
  const slug = await freeSlug(slugify(data.name));
  try {
    const row = await prismaClient.store.create({
      data: {
        slug,
        name: data.name,
        sheetId: data.sheetId ?? null,
        useDemoData: data.useDemoData,
        vatRate: data.vatRate,
        revenueBasis: data.revenueBasis,
        Owners: { create: [{ userId: ownerId }] },
      },
    });
    return storeSchema.parse(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new SheetAlreadyClaimedError();
    }
    throw error;
  }
};

export const updateStore = async (
  ownerId: string,
  storeId: string,
  data: StoreInput,
): Promise<Store> => {
  const owned = await getStoreById(ownerId, storeId);
  if (owned === undefined) {
    throw new Error('Store not found');
  }
  const fields = {
    name: data.name,
    sheetId: data.sheetId ?? null,
    useDemoData: data.useDemoData,
    vatRate: data.vatRate,
    revenueBasis: data.revenueBasis,
  };
  try {
    const row = await prismaClient.store.update({ where: { id: storeId }, data: fields });
    return storeSchema.parse(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new SheetAlreadyClaimedError();
    }
    throw error;
  }
};

export const sheetSource = (store: Store): SheetSource => {
  if (store.useDemoData) {
    return { kind: 'demo' };
  }
  if (store.sheetId === undefined) {
    throw new SheetNotConfiguredError();
  }
  return { kind: 'google', spreadsheetId: store.sheetId };
};
