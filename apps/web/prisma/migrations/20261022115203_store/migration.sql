-- Presentations predate stores and can't be attributed to one; this only ever ran on dev data.
DELETE FROM "presentation";

-- DropIndex
DROP INDEX "presentation_month_key";

-- AlterTable
ALTER TABLE "presentation" ADD COLUMN     "store_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "store" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "sheet_id" TEXT,
    "use_demo_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_owner_id_key" ON "store"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_sheet_id_key" ON "store"("sheet_id");

-- CreateIndex
CREATE UNIQUE INDEX "presentation_store_id_month_key" ON "presentation"("store_id", "month");

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentation" ADD CONSTRAINT "presentation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

