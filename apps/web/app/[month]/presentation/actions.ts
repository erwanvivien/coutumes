'use server';

import type { Block } from '@/lib/report/blocks';
import { monthId, parseMonthSlug } from '@/lib/report/months';
import { blocksSchema } from '@/lib/schemas/report';
import { isAllowedEmail } from '@/lib/server/auth/allowlist';
import { publish, saveBlocks, unpublish } from '@/lib/server/presentations';
import { getMonthReport, SHEET_CACHE_TAG } from '@/lib/server/report';
import { storeName } from '@/lib/server/store';
import { getSessionUser } from '@/lib/session';
import { updateTag } from 'next/cache';

const assertEditor = async (): Promise<void> => {
  const sessionUser = await getSessionUser();
  if (sessionUser === undefined || !isAllowedEmail(sessionUser.email)) {
    throw new Error('Unauthorized');
  }
};

const monthFromSlug = (slug: string) => {
  const month = parseMonthSlug(slug);
  if (month === undefined) {
    throw new Error(`Invalid month: ${slug}`);
  }
  return month;
};

export const savePresentationBlocks = async (slug: string, blocks: Block[]): Promise<void> => {
  await assertEditor();
  await saveBlocks(monthId(monthFromSlug(slug)), blocksSchema.parse(blocks));
};

export type PublishResult = { shareToken: string; publishedAt: string };

/** Re-reads the sheet, then freezes the current blocks and figures behind the share link. */
export const publishPresentation = async (
  slug: string,
  blocks: Block[],
): Promise<PublishResult> => {
  await assertEditor();
  const month = monthFromSlug(slug);

  updateTag(SHEET_CACHE_TAG);
  const report = await getMonthReport(month);
  if (report === undefined) {
    throw new Error('No sheet tab for this month');
  }

  const presentation = await publish(monthId(month), {
    storeName: storeName(),
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
  await assertEditor();
  await unpublish(monthId(monthFromSlug(slug)));
};
