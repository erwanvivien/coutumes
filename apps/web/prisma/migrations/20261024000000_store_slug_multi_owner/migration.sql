-- AlterTable
ALTER TABLE "store" ADD COLUMN "slug" VARCHAR(80);

-- Backfill: slugify the existing name, suffixed with part of the row id so it's unique even if
-- two stores share a name.
UPDATE "store"
SET "slug" = substr(
  substr(regexp_replace(regexp_replace(lower(trim("name")), '[^a-z0-9]+', '-', 'g'), '^-|-$', '', 'g'), 1, 60)
    || '-' || substr(id::text, 1, 8),
  1, 80
)
WHERE "slug" IS NULL;

ALTER TABLE "store" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "store_slug_key" ON "store"("slug");

-- CreateTable: a store can have several owners, and an owner several stores
CREATE TABLE "store_owner" (
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_owner_pkey" PRIMARY KEY ("store_id", "user_id")
);

-- CreateIndex
CREATE INDEX "store_owner_user_id_idx" ON "store_owner"("user_id");

-- AddForeignKey
ALTER TABLE "store_owner" ADD CONSTRAINT "store_owner_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_owner" ADD CONSTRAINT "store_owner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: each existing store's single owner becomes its first row in store_owner
INSERT INTO "store_owner" ("store_id", "user_id")
SELECT "id", "owner_id" FROM "store";

-- DropForeignKey
ALTER TABLE "store" DROP CONSTRAINT "store_owner_id_fkey";

-- DropIndex
DROP INDEX "store_owner_id_key";

-- AlterTable
ALTER TABLE "store" DROP COLUMN "owner_id";
