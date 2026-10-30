-- Enable Row Level Security on the Event table, created by the CI-generated
-- migration just before this one. No policies, never FORCE. Hand-written on
-- purpose: RLS is not expressible in the Prisma schema (docs/rules/auth.md).
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
