import 'server-only'
import { getTranslations } from 'next-intl/server'
import { canChangePromise } from '@/lib/check-in'
import { AppError } from '@/lib/errors/app-error'
import type { PromiseChoice } from '@/lib/promise'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'
import { chosenPromise } from '@/server/promises/create-promise'
import { readCheckIn } from './read-check-in'

/**
 * Rewrites a committed Promise until the 4am after it was made, with its Event in
 * the same transaction (ADR 0001). The Event's key makes a repeated submission
 * save once (ADR 0002), so an old repeat can't undo a newer change.
 */
export async function changePromise({
	userId,
	promiseId,
	changeId,
	choice
}: {
	userId: string
	promiseId: string
	changeId: string
	choice: PromiseChoice
}): Promise<void> {
	const t = await getTranslations('TodayPage.changePromise')
	const idempotencyKey = `promise_changed:${changeId}`
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const repeat = await tx.event.findUnique({
					where: { userId_idempotencyKey: { userId, idempotencyKey } },
					select: { id: true }
				})
				if (repeat != null) return

				const { today, latestPromise: promise } = await readCheckIn({ client: tx, userId })
				if (promise?.id !== promiseId || !canChangePromise({ ...promise, today })) {
					throw new AppError(t('closed'), { status: 409, code: 'promise_closed' })
				}

				const chosen = await chosenPromise({ tx, userId, choice })
				const isSame =
					chosen.planActionId === promise.planActionId &&
					chosen.wording === promise.wording &&
					choice.moment === promise.moment
				if (isSame) return

				const saved = await recordEvent({
					tx,
					event: {
						userId,
						name: 'promise_changed',
						keptDay: today,
						details: {
							promiseId,
							promiseDay: promise.promiseDay,
							actionId: chosen.planActionId,
							size: chosen.size,
							moment: choice.moment
						},
						idempotencyKey
					}
				})
				if (!saved) return
				await tx.promise.update({
					where: { id: promiseId },
					data: { ...chosen, moment: choice.moment }
				})
			}),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}
