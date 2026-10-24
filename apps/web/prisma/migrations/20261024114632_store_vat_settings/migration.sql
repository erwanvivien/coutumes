-- CreateEnum
CREATE TYPE "RevenueBasis" AS ENUM ('ht', 'ttc');

-- AlterTable
ALTER TABLE "store" ADD COLUMN     "revenue_basis" "RevenueBasis" NOT NULL DEFAULT 'ht',
ADD COLUMN     "vat_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.2;
