-- Presentations now cover a month ("2026-11") or a week (its Monday, "2026-10-12")
ALTER TABLE "presentation" RENAME COLUMN "month" TO "period";
ALTER TABLE "presentation" ALTER COLUMN "period" SET DATA TYPE VARCHAR(10);

-- RenameIndex
ALTER INDEX "presentation_store_id_month_key" RENAME TO "presentation_store_id_period_key";
