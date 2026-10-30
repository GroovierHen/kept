-- AlterTable
ALTER TABLE "users" ADD COLUMN     "costs_pence" INTEGER,
ADD COLUMN     "first_reminder_time" TEXT,
ADD COLUMN     "income_pence" INTEGER,
ADD COLUMN     "is_counted_in_results" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_demo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savings_pence" INTEGER,
ADD COLUMN     "time_zone" TEXT NOT NULL DEFAULT 'Europe/London';

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kept_day" DATE NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_user_id_kept_day_idx" ON "events"("user_id", "kept_day");

-- CreateIndex
CREATE INDEX "events_name_kept_day_idx" ON "events"("name", "kept_day");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
