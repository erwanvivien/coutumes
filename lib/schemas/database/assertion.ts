import type { JsonValue } from '@prisma/client/runtime/client';
import type { z } from 'zod';

type VerifyKeys<A, B> = keyof A extends keyof B ? (keyof B extends keyof A ? true : false) : false;

type ReplaceNullWithUndefined<T> = null extends T ? Exclude<T, null> | undefined : T;

type WithoutJsonValues<Prisma> = {
  [K in keyof Prisma as JsonValue extends Prisma[K] ? never : K]: Prisma[K];
};

type AssertSchemaAndPrismaVerifyValues<Schema, Prisma> = {
  [K in keyof Prisma]: K extends keyof Schema
    ? JsonValue extends Prisma[K]
      ? true
      : Schema[K] extends ReplaceNullWithUndefined<Prisma[K]>
        ? ReplaceNullWithUndefined<Prisma[K]> extends Schema[K]
          ? true
          : false
        : false
    : false;
};

type Brandable = string | number | symbol;
type BrandableOf<T> = T extends number
  ? number
  : T extends string
    ? string
    : T extends symbol
      ? symbol
      : T;

type RemoveZodBranding<Schema> = {
  [K in keyof Schema]: Schema[K] extends z.core.$brand<Brandable> | null | undefined
    ? BrandableOf<NonNullable<Schema[K]>> | Extract<Schema[K], null | undefined>
    : Schema[K];
};

export type AssertSchemaAndPrisma<Schema, Prisma, SimplePrisma = WithoutJsonValues<Prisma>> =
  VerifyKeys<Schema, Prisma> extends true
    ? AssertSchemaAndPrismaVerifyValues<
        RemoveZodBranding<Schema>,
        SimplePrisma
      >[keyof SimplePrisma] extends true
      ? true
      : `Some values are not compatible between A and B`
    : `Some keys are missing in B`;
