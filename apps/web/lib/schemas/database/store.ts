import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports
import type { Store as PrismaStore } from '@/prisma/generated/client';
import { booleanSchema, dateSchema, nullToUndefinedSchema, uuidSchema } from '../utils';
import type { AssertSchemaAndPrisma } from './assertion';

export const storeNameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom de la boutique est requis')
  .max(80, 'Le nom est trop long (80 caractères maximum)');

export const storeSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Le format de l'identifiant est invalide");

export const storeSchema = z.object({
  id: uuidSchema,
  slug: storeSlugSchema,

  name: storeNameSchema,
  sheetId: nullToUndefinedSchema(z.string()),
  useDemoData: booleanSchema,

  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type Store = z.infer<typeof storeSchema>;

const _typescriptAssert: AssertSchemaAndPrisma<Store, PrismaStore> = true;
