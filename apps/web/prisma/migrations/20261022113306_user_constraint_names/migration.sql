-- AlterTable
ALTER TABLE "user" RENAME CONSTRAINT "User_pkey" TO "user_pkey";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "user_email_key";
