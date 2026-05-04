import { assert, assertDefined } from "@/lib";
import { PrismaClient } from "@/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const prismaClient: Omit<PrismaClient, `$${string}`> & {
  $transaction: PrismaClient["$transaction"];
} = {
  get user() {
    return getPrismaClient().user;
  },
  get userAuth() {
    return getPrismaClient().userAuth;
  },
  get $transaction() {
    return getPrismaClient().$transaction.bind(this);
  },
};

let _prismaClientCache: PrismaClient | undefined;

const getPrismaClient = (): PrismaClient => {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  // if (globalForPrisma.prisma !== undefined) {
  //   return globalForPrisma.prisma;
  // }

  if (_prismaClientCache !== undefined) {
    return _prismaClientCache;
  }

  console.info("Creating new Prisma Client instance");
  const adapter = new PrismaPg({ connectionString: getPostgresUrl() });

  _prismaClientCache ??= new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = _prismaClientCache;
  }

  return _prismaClientCache;
};

const getPostgresUrl = (): string => {
  const POSTGRES_URL = process.env.POSTGRES_URL;
  assertDefined(
    POSTGRES_URL,
    "POSTGRES_URL is not defined in environment variables"
  );

  if (!POSTGRES_URL.includes("$")) {
    return POSTGRES_URL;
  }

  let updatedUrl = POSTGRES_URL;
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) {
      continue;
    }

    const placeholder = `$\{${key}\}`;
    if (updatedUrl.includes(placeholder)) {
      updatedUrl = updatedUrl.replace(placeholder, value);
    }
  }

  assert(
    !updatedUrl.includes("$"),
    "All placeholders in POSTGRES_URL were not replaced"
  );
  return updatedUrl;
};
