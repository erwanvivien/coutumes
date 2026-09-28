import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports
import type { User as PrismaUser } from '@/prisma/generated/client';
import { dateSchema, emailSchema, nullToUndefinedSchema, uuidSchema } from '../utils';
import type { AssertSchemaAndPrisma } from './assertion';

const instagramRegex = /^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
export const instagramHandleSchema = z
  .string()
  .min(1)
  .max(30 + 1) // +1 to account for optional @
  .regex(instagramRegex, 'Invalid Instagram handle')
  .transform((handle) => handle.toLowerCase().replace(/^@/, ''));

const userNameSchema = z.string().max(64);

export const userSchema = z.object({
  id: uuidSchema,

  email: emailSchema,
  name: userNameSchema,
  imageUrl: nullToUndefinedSchema(z.string()),

  customerId: nullToUndefinedSchema(z.string()),

  emailVerifiedAt: nullToUndefinedSchema(dateSchema),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type User = z.infer<typeof userSchema>;

const _typescriptAssert: AssertSchemaAndPrisma<User, PrismaUser> = true;
