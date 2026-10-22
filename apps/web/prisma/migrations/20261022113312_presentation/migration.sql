-- CreateTable
CREATE TABLE "presentation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "month" VARCHAR(7) NOT NULL,
    "blocks" JSONB NOT NULL,
    "share_token" TEXT,
    "snapshot" JSONB,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presentation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presentation_month_key" ON "presentation"("month");

-- CreateIndex
CREATE UNIQUE INDEX "presentation_share_token_key" ON "presentation"("share_token");
