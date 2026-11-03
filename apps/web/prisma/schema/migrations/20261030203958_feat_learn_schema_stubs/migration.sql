-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "text" VARCHAR(280),
    "weeks" INTEGER,
    "starting_point" VARCHAR(280),
    "obstacle" VARCHAR(280),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "text" VARCHAR(200) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_actions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "small" VARCHAR(160) NOT NULL,
    "medium" VARCHAR(160) NOT NULL,
    "large" VARCHAR(160) NOT NULL,

    CONSTRAINT "plan_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_ideas" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "lesson" TEXT NOT NULL,
    "question" VARCHAR(300) NOT NULL,
    "model_answer" TEXT NOT NULL,
    "choices" TEXT[],
    "correct_choice" INTEGER NOT NULL,
    "taught_on" DATE,

    CONSTRAINT "key_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key_idea_id" UUID NOT NULL,
    "due_on" DATE NOT NULL,
    "recall_attempt_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recall_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key_idea_id" UUID NOT NULL,
    "kept_day" DATE NOT NULL,
    "answer" VARCHAR(1000) NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "is_multiple_choice" BOOLEAN NOT NULL,
    "dispute_reason" VARCHAR(1000),
    "disputed_at" TIMESTAMPTZ(6),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recall_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goals_user_id_key" ON "goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_user_id_key" ON "plans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_goal_id_key" ON "plans"("goal_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_plan_id_position_key" ON "milestones"("plan_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "plan_actions_plan_id_position_key" ON "plan_actions"("plan_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "key_ideas_plan_id_position_key" ON "key_ideas"("plan_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_recall_attempt_id_key" ON "reviews"("recall_attempt_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_due_on_idx" ON "reviews"("user_id", "due_on");

-- CreateIndex
CREATE INDEX "recall_attempts_key_idea_id_created_at_idx" ON "recall_attempts"("key_idea_id", "created_at");

-- CreateIndex
CREATE INDEX "recall_attempts_user_id_kept_day_idx" ON "recall_attempts"("user_id", "kept_day");

-- CreateIndex
CREATE UNIQUE INDEX "recall_attempts_user_id_idempotency_key_key" ON "recall_attempts"("user_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_actions" ADD CONSTRAINT "plan_actions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_ideas" ADD CONSTRAINT "key_ideas_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_key_idea_id_fkey" FOREIGN KEY ("key_idea_id") REFERENCES "key_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recall_attempt_id_fkey" FOREIGN KEY ("recall_attempt_id") REFERENCES "recall_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_attempts" ADD CONSTRAINT "recall_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_attempts" ADD CONSTRAINT "recall_attempts_key_idea_id_fkey" FOREIGN KEY ("key_idea_id") REFERENCES "key_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
