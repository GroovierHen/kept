-- CreateEnum
CREATE TYPE "PromiseSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "PromiseMoment" AS ENUM ('wake_up', 'lunch', 'after_work', 'before_bed');

-- CreateTable
CREATE TABLE "promises" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "promise_day" DATE NOT NULL,
    "plan_action_id" UUID,
    "size" "PromiseSize",
    "wording" VARCHAR(160) NOT NULL,
    "moment" "PromiseMoment" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promises_plan_action_id_idx" ON "promises"("plan_action_id");

-- CreateIndex
CREATE UNIQUE INDEX "promises_user_id_promise_day_key" ON "promises"("user_id", "promise_day");

-- AddForeignKey
ALTER TABLE "promises" ADD CONSTRAINT "promises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promises" ADD CONSTRAINT "promises_plan_action_id_fkey" FOREIGN KEY ("plan_action_id") REFERENCES "plan_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
