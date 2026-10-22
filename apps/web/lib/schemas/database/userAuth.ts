import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports
import type { UserAuth as PrismaUserAuth } from '@/prisma/generated/client';
import { dateSchema, nullToUndefinedSchema, uuidSchema } from '../utils';
import type { AssertSchemaAndPrisma } from './assertion';

const googleConfSchema = z.object({
  sub: z.string(),
  email: nullToUndefinedSchema(z.string()),
  email_verified: nullToUndefinedSchema(z.boolean()),
  name: nullToUndefinedSchema(z.string()),
  picture: nullToUndefinedSchema(z.string()),
});

export const authConfSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('google'), conf: googleConfSchema }),
]);
export type AuthConf = z.output<typeof authConfSchema>;

export const userAuthSchema = z
  .object({
    userId: uuidSchema,

    createdAt: dateSchema,
    updatedAt: dateSchema,
  })
  .and(authConfSchema);
export type UserAuth = z.infer<typeof userAuthSchema>;

const _typescriptAssert: AssertSchemaAndPrisma<UserAuth, PrismaUserAuth> = true;
