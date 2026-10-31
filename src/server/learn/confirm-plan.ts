import 'server-only'
import { toKeptDay } from '@/lib/kept-day'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'

// Serializable like the edits in edit-plan.ts, so an edit racing Confirm
// either lands first or sees the plan locked.
const SERIALIZABLE = { isolationLevel: 'Serializable' } as const

/**
 * Locks the user's plan. Only an unconfirmed plan changes, so a double tap
 * confirms once, and its Event is saved in the same transaction with a
 * once-only key. Returns whether this call did the confirming.
 */
export function markPlanConfirmed(userId: string): Promise<boolean> {
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const { count } = await tx.plan.updateMany({
					where: { userId, confirmedAt: null },
					data: { confirmedAt: new Date() }
				})
				if (count === 0) return false
				const { timeZone } = await tx.user.findUniqueOrThrow({
					where: { id: userId },
					select: { timeZone: true }
				})
				await recordEvent({
					tx,
					event: {
						userId,
						name: 'plan_confirmed',
						keptDay: toKeptDay({ instant: new Date(), timeZone }),
						details: {},
						idempotencyKey: 'plan_confirmed'
					}
				})
				return true
			}, SERIALIZABLE),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}
