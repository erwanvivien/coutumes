import { z } from 'zod';

export const booleanSchema = z
  .union([z.literal(true), z.literal(false), z.literal('true'), z.literal('false')])
  .transform((v) => v === 'true' || v === true);

export const uuidSchema = z
  .string()
  .refine(
    (val) =>
      /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(val),
    { message: "Le format d'ID est invalide" },
  );

export const dateSchema = z
  .string()
  // eslint-disable-next-line no-restricted-syntax
  .or(z.date())
  .transform((v) => new Date(v))
  .refine((arg) => !isNaN(arg.getTime()), { error: 'Invalid date' });

export const emailSchema = z.email({ error: "L'email est invalide" }).trim().toLowerCase();

export const nullToUndefinedSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null(), z.undefined()]).transform((v) => (v === null ? undefined : v));
