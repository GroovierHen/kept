import 'server-only'
import { getTranslations } from 'next-intl/server'
import { AppError } from '@/lib/errors/app-error'
import { nextPromiseDay, type KeptDay } from '@/lib/kept-day'
import type { PromiseChoice } from '@/lib/promise'
import type { Prisma } from '@/server/db/client'
import { recordEvent } from '@/server/events/record-event'

export async function chosenPromise({
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
	// Every action starts at small (docs/product/walkthrough.md, Day 1). Nothing
	// changes a size until the adaptive engine lands (#18).
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

/** Saves a Promise with its Event in the caller's transaction (ADR 0001). */
export async function createPromise({
	tx,
	userId,
	choice,
	today,
	latestPromiseDay
}: {
	tx: Prisma.TransactionClient
	userId: string
	choice: PromiseChoice
	today: KeptDay
	latestPromiseDay: KeptDay | null
}): Promise<void> {
	const promiseDay = nextPromiseDay({ today, latestPromiseDay })
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
}
