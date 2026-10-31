import 'server-only'
import { checkInStep } from '@/lib/check-in'
import type { PromiseChoice } from '@/lib/promise'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, isUniqueViolation, logDbRetry } from '@/server/db/transient-error'
import { createPromise } from '@/server/promises/create-promise'
import { readCheckIn } from './read-check-in'

/**
 * Commits the next Promise, only while the check-in is waiting for one. Two taps
 * at once meet at the unique Kept day, and the loser retries and finds it done.
 * Learn's step isn't checked here: it writes nothing a Promise depends on.
 */
export function commitNextPromise({
	userId,
	choice
}: {
	userId: string
	choice: PromiseChoice
}): Promise<void> {
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const { today, latestPromise } = await readCheckIn({ client: tx, userId })
				if (checkInStep({ today, latestPromise, hasLearned: true }) !== 'commit') return
				await createPromise({
					tx,
					userId,
					choice,
					today,
					latestPromiseDay: latestPromise?.promiseDay ?? null
				})
			}),
		{
			isRetryable: (error) => isUniqueViolation(error) || isTransientDbError(error),
			onRetry: logDbRetry
		}
	)
}
