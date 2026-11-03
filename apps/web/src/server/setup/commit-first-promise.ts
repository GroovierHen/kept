import 'server-only'
import { toKeptDay } from '@/lib/kept-day'
import type { PromiseChoice } from '@/lib/promise'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, isUniqueViolation, logDbRetry } from '@/server/db/transient-error'
import { createPromise } from '@/server/promises/create-promise'

/**
 * Commits setup's Promise, for the next Kept day. A user who already has a
 * Promise keeps it. Two taps at once meet at the unique Kept day, and the loser
 * retries and finds the first.
 */
export function commitFirstPromise({
	userId,
	choice
}: {
	userId: string
	choice: PromiseChoice
}): Promise<void> {
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const existing = await tx.promise.findFirst({ where: { userId }, select: { id: true } })
				if (existing != null) return

				const { timeZone } = await tx.user.findUniqueOrThrow({
					where: { id: userId },
					select: { timeZone: true }
				})
				const today = toKeptDay({ instant: new Date(), timeZone })
				await createPromise({ tx, userId, choice, today, latestPromiseDay: null })
			}),
		{
			isRetryable: (error) => isUniqueViolation(error) || isTransientDbError(error),
			onRetry: logDbRetry
		}
	)
}
