-- Enable Row Level Security on Learn's tables, created by the CI-generated
-- migration just before this one. No policies, never FORCE. Hand-written on
-- purpose: RLS is not expressible in the Prisma schema (docs/rules/auth.md).
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "key_ideas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recall_attempts" ENABLE ROW LEVEL SECURITY;
