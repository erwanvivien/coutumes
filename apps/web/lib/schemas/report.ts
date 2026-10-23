import type { Block } from '@/lib/report/blocks';
import type { MonthReport } from '@/lib/report/types';
import { z } from 'zod';

const optionalNumber = z.number().optional();

export const monthReportSchema = z.object({
  month: z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }),
  tabName: z.string(),
  monthlyObjective: optionalNumber,
  extraColumns: z.array(z.string()),
  days: z.array(
    z.object({
      day: z.number().int().min(1).max(31),
      revenue: optionalNumber,
      objective: optionalNumber,
      tickets: optionalNumber,
      items: optionalNumber,
      visitors: optionalNumber,
      cash: optionalNumber,
      extras: z.record(z.string(), optionalNumber),
    }),
  ),
  fetchedAt: z.string(),
}) satisfies z.ZodType<MonthReport>;

const id = z.string().min(1).max(64);
const text = z.string().max(5000);

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ id, type: z.literal('heading'), text }),
  z.object({ id, type: z.literal('text'), text }),
  z.object({ id, type: z.literal('kpis') }),
  z.object({ id, type: z.literal('daily-chart') }),
  z.object({ id, type: z.literal('cumulative-chart') }),
  z.object({ id, type: z.literal('weekly-table') }),
  z.object({ id, type: z.literal('daily-table') }),
  z.object({ id, type: z.literal('week-recap') }),
  z.object({ id, type: z.literal('week-chart') }),
  z.object({ id, type: z.literal('week-table') }),
  z.object({ id, type: z.literal('page-break') }),
]) satisfies z.ZodType<Block>;

export const blocksSchema = z.array(blockSchema).max(200);

/** What a share link shows: frozen at publish time so later sheet edits don't change it.
 * Month snapshots published before weekly recaps existed have no `kind`. */
const monthSnapshotSchema = z.object({
  kind: z.literal('month').optional(),
  storeName: z.string(),
  report: monthReportSchema,
  blocks: blocksSchema,
});

/** A week reads up to three month tabs (the week, the one before, month-to-date) */
const weekSnapshotSchema = z.object({
  kind: z.literal('week'),
  storeName: z.string(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reports: z.array(monthReportSchema).max(3),
  fetchedAt: z.string(),
  blocks: blocksSchema,
});

export const snapshotSchema = z.union([weekSnapshotSchema, monthSnapshotSchema]);
export type Snapshot = z.infer<typeof snapshotSchema>;
