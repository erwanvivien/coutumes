import { defaultBlocks, type Block } from '@/lib/report/blocks';
import { presentationSchema, type Presentation } from '@/lib/schemas/database/presentation';
import type { Snapshot } from '@/lib/schemas/report';
import { Prisma } from '@/prisma/generated/client';
import { randomBytes } from 'node:crypto';
import { prismaClient } from './db';

const byMonth = (storeId: string, month: string) => ({ storeId_month: { storeId, month } });

/** The store's presentation for a month, created with the default layout on first visit. */
export const getOrCreatePresentation = async (
  storeId: string,
  month: string,
): Promise<Presentation> => {
  const row = await prismaClient.presentation.upsert({
    where: byMonth(storeId, month),
    create: { storeId, month, blocks: defaultBlocks() },
    update: {},
  });
  return presentationSchema.parse(row);
};

export const saveBlocks = async (
  storeId: string,
  month: string,
  blocks: Block[],
): Promise<void> => {
  await prismaClient.presentation.update({ where: byMonth(storeId, month), data: { blocks } });
};

/** Freezes the blocks and figures behind the share link, keeping the link if one exists. */
export const publish = async (
  storeId: string,
  month: string,
  snapshot: Snapshot,
): Promise<Presentation> => {
  const existing = await prismaClient.presentation.findUniqueOrThrow({
    where: byMonth(storeId, month),
  });
  const row = await prismaClient.presentation.update({
    where: byMonth(storeId, month),
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

export const unpublish = async (storeId: string, month: string): Promise<void> => {
  await prismaClient.presentation.update({
    where: byMonth(storeId, month),
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
