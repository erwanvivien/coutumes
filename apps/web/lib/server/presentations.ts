import { defaultBlocks, type Block } from '@/lib/report/blocks';
import { periodId, type Period } from '@/lib/report/periods';
import { presentationSchema, type Presentation } from '@/lib/schemas/database/presentation';
import type { Snapshot } from '@/lib/schemas/report';
import { Prisma } from '@/prisma/generated/client';
import { randomBytes } from 'node:crypto';
import { prismaClient } from './db';

const byPeriod = (storeId: string, period: Period) => ({
  storeId_period: { storeId, period: periodId(period) },
});

/** The store's presentation for a month or week, created with the default layout on first
 * visit. */
export const getOrCreatePresentation = async (
  storeId: string,
  period: Period,
): Promise<Presentation> => {
  const row = await prismaClient.presentation.upsert({
    where: byPeriod(storeId, period),
    create: { storeId, period: periodId(period), blocks: defaultBlocks(period.kind) },
    update: {},
  });
  return presentationSchema.parse(row);
};

export const saveBlocks = async (
  storeId: string,
  period: Period,
  blocks: Block[],
): Promise<void> => {
  await prismaClient.presentation.update({ where: byPeriod(storeId, period), data: { blocks } });
};

/** Freezes the blocks and figures behind the share link, keeping the link if one exists. */
export const publish = async (
  storeId: string,
  period: Period,
  snapshot: Snapshot,
): Promise<Presentation> => {
  const existing = await prismaClient.presentation.findUniqueOrThrow({
    where: byPeriod(storeId, period),
  });
  const row = await prismaClient.presentation.update({
    where: byPeriod(storeId, period),
    data: {
      blocks: snapshot.blocks,
      snapshot,
      publishedAt: new Date(),
      // 144 bits: unguessable, and short enough to paste in an email
      shareToken: existing.shareToken ?? randomBytes(18).toString('base64url'),
    },
  });
  return presentationSchema.parse(row);
};

export const unpublish = async (storeId: string, period: Period): Promise<void> => {
  await prismaClient.presentation.update({
    where: byPeriod(storeId, period),
    data: { shareToken: null, snapshot: Prisma.DbNull, publishedAt: null },
  });
};

export const getPublishedSnapshot = async (shareToken: string): Promise<Snapshot | undefined> => {
  const row = await prismaClient.presentation.findUnique({ where: { shareToken } });
  if (row === null) {
    return undefined;
  }
  return presentationSchema.parse(row).snapshot;
};
