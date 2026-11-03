import { PrismaPg } from '@prisma/adapter-pg'
// A relative import: the database scripts load this file with plain Node,
// which knows nothing of the `@/` alias.
import { PrismaClient } from '../../generated/prisma/client.ts'

// Constructs a Prisma client over the `pg` driver adapter, which Prisma 7
// requires. Not `server-only`: the database scripts and the browser tests
// build their own client from here too. Application code imports `db` from
// ./client instead (docs/rules/database.md).

type PoolOptions = Exclude<ConstructorParameters<typeof PrismaPg>[0], { connect: unknown }>

// Query parameters only Prisma's own engine understood. `pg` would pass them
// on to the server as startup parameters, which the pooler rejects.
const PRISMA_ONLY_PARAMS = ['pgbouncer', 'connection_limit', 'pool_timeout', 'statement_cache_size']

// Prisma 6 gave up on a connection after 5 seconds; `pg` waits forever.
const CONNECT_TIMEOUT_MS = 5000

/**
 * The `pg` pool options for a Prisma-style connection URL.
 *
 * `sslmode` is taken out of the URL and applied here: `pg` treats `require`
 * as "verify the certificate against the system CAs", which Supabase's pooler
 * certificate is not signed by. Prisma 6 encrypted without verifying, and this
 * keeps that. `disable` turns TLS off, as it did before.
 */
export function poolOptions(connectionString: string): PoolOptions {
	const url = new URL(connectionString)
	for (const name of PRISMA_ONLY_PARAMS) url.searchParams.delete(name)
	const sslmode = url.searchParams.get('sslmode')
	url.searchParams.delete('sslmode')
	return {
		connectionString: url.toString(),
		connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
		...(sslmode != null && sslmode !== 'disable' ? { ssl: { rejectUnauthorized: false } } : {})
	}
}

export function createPrismaClient(
	connectionString: string,
	options: { transactionOptions?: { maxWait: number; timeout: number } } = {}
): PrismaClient {
	return new PrismaClient({ adapter: new PrismaPg(poolOptions(connectionString)), ...options })
}

export type { PrismaClient }
