'use server';

import type { Block } from '@/lib/report/blocks';
import { monthId, parseMonthSlug } from '@/lib/report/months';
import { blocksSchema } from '@/lib/schemas/report';
import { currentStore } from '@/lib/server/access';
import { publish, saveBlocks, unpublish } from '@/lib/server/presentations';
import { getMonthReport, sheetCacheTag } from '@/lib/server/report';
import { updateTag } from 'next/cache';

const monthFromSlug = (slug: string) => {
  const month = parseMonthSlug(slug);
  if (month === undefined) {
    throw new Error(`Invalid month: ${slug}`);
  }
  return month;
};

export const savePresentationBlocks = async (slug: string, blocks: Block[]): Promise<void> => {
  const store = await currentStore();
  await saveBlocks(store.id, monthId(monthFromSlug(slug)), blocksSchema.parse(blocks));
};

export type PublishResult = { shareToken: string; publishedAt: string };

/** Re-reads the sheet, then freezes the current blocks and figures behind the share link. */
export const publishPresentation = async (
  slug: string,
  blocks: Block[],
): Promise<PublishResult> => {
  const store = await currentStore();
  const month = monthFromSlug(slug);

  updateTag(sheetCacheTag(store.id));
  const report = await getMonthReport(store, month);
  if (report === undefined) {
    throw new Error('No sheet tab for this month');
  }

  const presentation = await publish(store.id, monthId(month), {
    storeName: store.name,
    report,
    blocks: blocksSchema.parse(blocks),
  });
  if (presentation.shareToken === undefined || presentation.publishedAt === undefined) {
    throw new Error('Publishing did not produce a share link');
  }
  return {
    shareToken: presentation.shareToken,
    publishedAt: presentation.publishedAt.toISOString(),
  };
};

export const unpublishPresentation = async (slug: string): Promise<void> => {
  const store = await currentStore();
  await unpublish(store.id, monthId(monthFromSlug(slug)));
};
