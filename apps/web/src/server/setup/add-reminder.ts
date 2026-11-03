import 'server-only'
import { toKeptDay } from '@/lib/kept-day'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'
import { recordSetupFinished } from './record-setup-finished'

/**
 * The last step of setup: saves the first chosen time, its Event and
 * setup_finished in one transaction (ADR 0001). Only the first time is stored,
 * because later changes happen in the user's own calendar.
 */
export function addReminder({ userId, time }: { userId: string; time: string }): Promise<void> {
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const { count } = await tx.user.updateMany({
					where: { id: userId, firstReminderTime: null },
					data: { firstReminderTime: time }
				})
				if (count === 0) return
				const { timeZone } = await tx.user.findUniqueOrThrow({
					where: { id: userId },
					select: { timeZone: true }
				})
				await recordEvent({
					tx,
					event: {
						userId,
						name: 'reminder_added',
						keptDay: toKeptDay({ instant: new Date(), timeZone }),
						details: {},
						idempotencyKey: 'reminder_added'
					}
				})
				await recordSetupFinished({ tx, userId })
			}),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}
