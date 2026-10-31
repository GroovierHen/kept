import 'server-only'
import { getTranslations } from 'next-intl/server'
import { AppError } from '@/lib/errors/app-error'
import { nextPromiseDay, toKeptDay } from '@/lib/kept-day'
import type { PromiseChoice } from '@/lib/promise'
import { withRetry } from '@/lib/retry'
import { db, type Prisma } from '@/server/db/client'
import { isTransientDbError, isUniqueViolation, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'

async function chosenPromise({
	tx,
	userId,
	choice
}: {
	tx: Prisma.TransactionClient
	userId: string
	choice: PromiseChoice
}) {
	if (choice.kind === 'typed') {
		return { planActionId: null, size: null, wording: choice.wording }
	}
	// Every action starts at small (docs/product/walkthrough.md, Day 1).
	const action = await tx.planAction.findFirst({
		where: { id: choice.actionId, plan: { userId, confirmedAt: { not: null } } },
		select: { id: true, small: true }
	})
	if (action == null) {
		const t = await getTranslations('SetupPage.promise.errors')
		throw new AppError(t('actionGone'), { status: 404, code: 'action_not_found' })
	}
	return { planActionId: action.id, size: 'small' as const, wording: action.small }
}

/**
 * Commits setup's Promise, for the next Kept day, with its Event in the same
 * transaction (ADR 0001). A user who already has a Promise keeps it. Two taps at
 * once meet at the unique Kept day, and the loser retries and finds the first.
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
				const promiseDay = nextPromiseDay({ today, latestPromiseDay: null })
				const chosen = await chosenPromise({ tx, userId, choice })
				const promise = await tx.promise.create({
					data: {
						userId,
						promiseDay: new Date(`${promiseDay}T00:00:00Z`),
						moment: choice.moment,
						...chosen
					},
					select: { id: true }
				})
				await recordEvent({
					tx,
					event: {
						userId,
						name: 'promise_committed',
						keptDay: today,
						details: {
							promiseId: promise.id,
							promiseDay,
							actionId: chosen.planActionId,
							size: chosen.size,
							moment: choice.moment
						},
						idempotencyKey: `promise_committed:${promise.id}`
					}
				})
			}),
		{
			isRetryable: (error) => isUniqueViolation(error) || isTransientDbError(error),
			onRetry: logDbRetry
		}
	)
}
