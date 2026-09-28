import 'dotenv/config';
import type { PrismaConfig } from 'prisma/config';

const getPostgresUrl = (): string => {
  const POSTGRES_URL = process.env.POSTGRES_URL;
  if (!POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined in environment variables');
  }

  if (!POSTGRES_URL.includes('$')) {
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

  if (updatedUrl.includes('$')) {
    throw new Error('All placeholders in POSTGRES_URL were not replaced');
  }
  return updatedUrl;
};

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url: getPostgresUrl() },
} satisfies PrismaConfig;
