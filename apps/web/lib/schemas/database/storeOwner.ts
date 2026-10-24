import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports
import type { StoreOwner as PrismaStoreOwner } from '@/prisma/generated/client';
import { dateSchema, uuidSchema } from '../utils';
import type { AssertSchemaAndPrisma } from './assertion';

export const storeOwnerSchema = z.object({
  storeId: uuidSchema,
  userId: uuidSchema,

  createdAt: dateSchema,
});
export type StoreOwner = z.infer<typeof storeOwnerSchema>;

const _typescriptAssert: AssertSchemaAndPrisma<StoreOwner, PrismaStoreOwner> = true;
