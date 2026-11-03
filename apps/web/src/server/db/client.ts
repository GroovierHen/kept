import 'server-only'
import { createPrismaClient, type PrismaClient } from './create-client'

// Re-exported from the one file allowed to import the generated client, so
// callers that need the Prisma namespace at runtime — e.g. Prisma.DbNull to
// clear a nullable Json column, or Prisma.* input types — get it from here
// rather than reaching for it directly. See docs/rules/database.md.
export { Prisma } from '@/generated/prisma/client.ts'

// Cache the client on globalThis outside production so hot-reload during
// `next dev` doesn't open a fresh connection pool on every file save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// The database sits next to production. From a laptop on the other side of
// the world a query takes about a second, so a transaction of ten (saving a
// plan) outlasts Prisma's 5s default and is rolled back. Outside production
// the limits are raised to fit; production keeps Prisma's defaults.
const TRANSACTION_OPTIONS =
	process.env.NODE_ENV === 'production'
		? { maxWait: 2000, timeout: 5000 }
		: { maxWait: 10_000, timeout: 30_000 }

function connectionString(): string {
	const url = process.env.DATABASE_URL
	if (url == null || url === '') throw new Error('DATABASE_URL is not set')
	return url
}

export const db =
	globalForPrisma.prisma ??
	createPrismaClient(connectionString(), { transactionOptions: TRANSACTION_OPTIONS })

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = db
}
