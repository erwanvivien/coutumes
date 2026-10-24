'use server';

import type { Block } from '@/lib/report/blocks';
import { parsePeriodId, type Period } from '@/lib/report/periods';
import { reportsForWeek } from '@/lib/report/weeks';
import { blocksSchema, type Snapshot } from '@/lib/schemas/report';
import { currentStore } from '@/lib/server/access';
import { publish, saveBlocks, unpublish } from '@/lib/server/presentations';
import { getMonthReport, getSheet, sheetCacheTag } from '@/lib/server/report';
import type { Store } from '@/lib/schemas/database/store';
import { updateTag } from 'next/cache';

// Actions take the period id ("2026-11", "2026-10-12") the editor was opened with
const periodFromId = (id: string): Period => {
  const period = parsePeriodId(id);
  if (period === undefined) {
    throw new Error(`Invalid period: ${id}`);
  }
  return period;
};

export const savePresentationBlocks = async (
  storeId: string,
  id: string,
  blocks: Block[],
): Promise<void> => {
  const store = await currentStore(storeId);
  await saveBlocks(store.id, periodFromId(id), blocksSchema.parse(blocks));
};

export type PublishResult = { shareToken: string; publishedAt: string };

const freeze = async (store: Store, period: Period, blocks: Block[]): Promise<Snapshot> => {
  if (period.kind === 'month') {
    const report = await getMonthReport(store, period.month);
    if (report === undefined) {
      throw new Error('No sheet tab for this month');
    }
    return { kind: 'month', storeName: store.name, report, blocks };
  }

  const reports = reportsForWeek((await getSheet(store)).reports, period.start);
  if (reports.length === 0) {
    throw new Error('No sheet tab for this week');
  }
  return {
    kind: 'week',
    storeName: store.name,
    weekStart: period.start,
    reports,
    fetchedAt: reports[0].fetchedAt,
    blocks,
  };
};

/** Re-reads the sheet, then freezes the current blocks and figures behind the share link. */
export const publishPresentation = async (
  storeId: string,
  id: string,
  blocks: Block[],
): Promise<PublishResult> => {
  const store = await currentStore(storeId);
  const period = periodFromId(id);

  updateTag(sheetCacheTag(store.id));
  const snapshot = await freeze(store, period, blocksSchema.parse(blocks));
  const presentation = await publish(store.id, period, snapshot);
  if (presentation.shareToken === undefined || presentation.publishedAt === undefined) {
    throw new Error('Publishing did not produce a share link');
  }
  return {
    shareToken: presentation.shareToken,
    publishedAt: presentation.publishedAt.toISOString(),
  };
};

export const unpublishPresentation = async (storeId: string, id: string): Promise<void> => {
  const store = await currentStore(storeId);
  await unpublish(store.id, periodFromId(id));
};
