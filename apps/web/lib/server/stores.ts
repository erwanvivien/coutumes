import { storeSchema, type Store } from '@/lib/schemas/database/store';
import { Prisma } from '@/prisma/generated/client';
import { prismaClient } from './db';
import { SheetNotConfiguredError, type SheetSource } from './sheets/client';

/** Another store already reads this sheet. */
export class SheetAlreadyClaimedError extends Error {
  constructor() {
    super('This Google Sheet is already linked to another store');
  }
}

export const getStoreByOwner = async (ownerId: string): Promise<Store | undefined> => {
  const row = await prismaClient.store.findUnique({ where: { ownerId } });
  return row === null ? undefined : storeSchema.parse(row);
};

export const saveStore = async (
  ownerId: string,
  data: { name: string; sheetId?: string; useDemoData: boolean },
): Promise<Store> => {
  const fields = { name: data.name, sheetId: data.sheetId ?? null, useDemoData: data.useDemoData };
  try {
    const row = await prismaClient.store.upsert({
      where: { ownerId },
      create: { ownerId, ...fields },
      update: fields,
    });
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
