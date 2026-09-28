-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google', 'apple');

-- CreateTable
CREATE TABLE "user_auth" (
    "user_id" UUID NOT NULL,
    "provider" "Provider" NOT NULL,
    "conf" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_user_id_provider_key" ON "user_auth"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
