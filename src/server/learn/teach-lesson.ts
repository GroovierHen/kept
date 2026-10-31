import 'server-only'
import { addDays, keptDayDate, toKeptDay, type KeptDay } from '@/lib/kept-day'
import { FIRST_REVIEW_AFTER_DAYS } from '@/lib/learn/lesson'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'
import { getTodaysLesson } from './learn'

/**
 * Marks today's key idea as taught, once the person has read it: sets its
 * taughtOn, books its first review, and records lesson_taught, all in one
 * transaction (ADR 0001). Only today's lesson can be taught, so a stale tab
 * can't teach a second idea on the same day, and only an untaught idea
 * changes, so a double tap teaches once. Returns whether this call taught it.
 */
export async function teachLesson({
	userId,
	keyIdeaId,
	keptDay
}: {
	userId: string
	keyIdeaId: string
	keptDay: KeptDay
}): Promise<boolean> {
	const lesson = await getTodaysLesson(userId, keptDay)
	if (lesson?.keyIdeaId !== keyIdeaId) return false

	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const { count } = await tx.keyIdea.updateMany({
					where: { id: keyIdeaId, taughtOn: null, plan: { userId, confirmedAt: { not: null } } },
					data: { taughtOn: keptDayDate(keptDay) }
				})
				if (count === 0) return false
				await tx.review.create({
					data: {
						userId,
						keyIdeaId,
						dueOn: keptDayDate(addDays({ day: keptDay, days: FIRST_REVIEW_AFTER_DAYS }))
					}
				})
				await recordEvent({
					tx,
					event: {
						userId,
						name: 'lesson_taught',
						keptDay,
						details: { keyIdeaId },
						idempotencyKey: `lesson_taught:${keyIdeaId}`
					}
				})
				return true
			}),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}

/** Today's Kept day in the user's own time zone. */
export async function keptDayFor(userId: string): Promise<KeptDay> {
	const { timeZone } = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: { timeZone: true }
	})
	return toKeptDay({ instant: new Date(), timeZone })
}
