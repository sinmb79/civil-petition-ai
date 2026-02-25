CREATE TABLE "petitions" (
    "id" UUID NOT NULL,
    "raw_text" TEXT NOT NULL,
    "processing_type" TEXT NOT NULL,
    "budget_related" BOOLEAN NOT NULL,
    "discretionary" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "petitions_pkey" PRIMARY KEY ("id")
);
