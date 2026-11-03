-- Enable Row Level Security on promises, created by the CI-generated migration
-- just before this one. No policies, never FORCE. Hand-written on purpose: RLS
-- is not expressible in the Prisma schema (docs/rules/auth.md).
ALTER TABLE "promises" ENABLE ROW LEVEL SECURITY;
