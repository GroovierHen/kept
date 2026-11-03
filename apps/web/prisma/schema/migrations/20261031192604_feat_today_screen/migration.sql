-- CreateEnum
CREATE TYPE "ReportAnswer" AS ENUM ('yes', 'partly', 'no');

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "promise_id" UUID NOT NULL,
    "answer" "ReportAnswer" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_promise_id_created_at_idx" ON "reports"("promise_id", "created_at");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_promise_id_fkey" FOREIGN KEY ("promise_id") REFERENCES "promises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
