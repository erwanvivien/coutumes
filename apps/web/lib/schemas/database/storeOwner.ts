import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports
import type { StoreOwner as PrismaStoreOwner } from '@/prisma/generated/client';
import { dateSchema, uuidSchema } from '../utils';
import type { AssertSchemaAndPrisma } from './assertion';

/** Staff read the reports and prepare presentations; admins also manage the store. */
export const storeRoleSchema = z.enum(['staff', 'admin']);
export type StoreRole = z.infer<typeof storeRoleSchema>;

export const storeOwnerSchema = z.object({
  storeId: uuidSchema,
  userId: uuidSchema,
  role: storeRoleSchema,

  createdAt: dateSchema,
});
export type StoreOwner = z.infer<typeof storeOwnerSchema>;

const _typescriptAssert: AssertSchemaAndPrisma<StoreOwner, PrismaStoreOwner> = true;
