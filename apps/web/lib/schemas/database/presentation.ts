import { z } from 'zod';
// eslint-disable-next-line no-restricted-imports
import type { Presentation as PrismaPresentation } from '@/prisma/generated/client';
import { blocksSchema, snapshotSchema } from '../report';
import { dateSchema, nullToUndefinedSchema, uuidSchema } from '../utils';
import type { AssertSchemaAndPrisma } from './assertion';

export const presentationSchema = z.object({
  id: uuidSchema,
  storeId: uuidSchema,

  month: z.string().regex(/^\d{4}-\d{2}$/),
  blocks: blocksSchema,

  shareToken: nullToUndefinedSchema(z.string()),
  snapshot: nullToUndefinedSchema(snapshotSchema),
  publishedAt: nullToUndefinedSchema(dateSchema),

  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type Presentation = z.infer<typeof presentationSchema>;

const _typescriptAssert: AssertSchemaAndPrisma<Presentation, PrismaPresentation> = true;
