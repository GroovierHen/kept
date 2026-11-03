-- AlterTable
ALTER TABLE "events" ADD COLUMN     "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "events_user_id_idempotency_key_key" ON "events"("user_id", "idempotency_key");
