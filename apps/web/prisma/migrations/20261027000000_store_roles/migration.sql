-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('staff', 'admin');

-- AlterTable: everyone who had access so far managed the store, so they all start as admins
ALTER TABLE "store_owner" ADD COLUMN "role" "StoreRole" NOT NULL DEFAULT 'staff';
UPDATE "store_owner" SET "role" = 'admin';

-- AlterTable
ALTER TABLE "store" ADD COLUMN "super_admin_id" UUID;

-- Backfill: the earliest member of each store is taken to be its creator
UPDATE "store" s
SET "super_admin_id" = (
  SELECT o."user_id" FROM "store_owner" o
  WHERE o."store_id" = s."id"
  ORDER BY o."created_at" ASC, o."user_id" ASC
  LIMIT 1
);

-- A store nobody can reach any more has no one to own it
DELETE FROM "store" WHERE "super_admin_id" IS NULL;

ALTER TABLE "store" ALTER COLUMN "super_admin_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_super_admin_id_fkey" FOREIGN KEY ("super_admin_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
