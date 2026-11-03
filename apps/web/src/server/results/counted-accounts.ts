import type { Prisma } from '@/server/db/client'

/**
 * The accounts whose numbers count as results: Testers, not the Demo account or
 * our own (GLOSSARY.md). Every results read filters on this, through its `user`
 * relation: `db.event.findMany({ where: { user: COUNTED_ACCOUNTS } })`.
 */
export const COUNTED_ACCOUNTS = {
	isCountedInResults: true,
	isDemo: false
} satisfies Prisma.UserWhereInput
