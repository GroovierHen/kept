import { log } from '@/server/lib/logger'

// Prisma errors that mean "try again" rather than "this is wrong": the database
// couldn't be reached or timed out (P1001, P1002, P1008), the connection
// dropped (P1017), the pool had no free connection (P2024), or a transaction
// hit a write conflict or deadlock (P2034). A duplicate key or a missing row
// fails the same way every time, so it is never retried.
// https://www.prisma.io/docs/orm/reference/error-reference
const TRANSIENT_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2034'])

function prismaCode(error: unknown): unknown {
	if (typeof error !== 'object' || error == null) return undefined
	return 'code' in error ? error.code : 'errorCode' in error ? error.errorCode : undefined
}

export function isTransientDbError(error: unknown): boolean {
	const code = prismaCode(error)
	return typeof code === 'string' && TRANSIENT_CODES.has(code)
}

// A retry that works leaves no error behind, so this line is the only record
// that the database is wobbling.
export function logDbRetry({
	error,
	attempt,
	delayMs
}: {
	error: unknown
	attempt: number
	delayMs: number
}) {
	log.warn('retrying a database write', { code: String(prismaCode(error)), attempt, delayMs })
}
