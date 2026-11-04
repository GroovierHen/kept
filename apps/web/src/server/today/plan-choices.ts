import 'server-only'
import { promiseNudge, workedOutSize, type PromiseNudge } from '@/lib/adaptive'
import type { PromiseMoment } from '@/lib/promise'
import { db } from '@/server/db/client'
import { getPlan } from '@/server/learn/learn'
import { readPromiseHistory } from '@/server/promises/read-promise-history'

// What the promise picker offers on the Today screen, for the web's commit
// step and the app's alike: each Action at the Size its next Promise would be
// made at, what comes pre-selected, and any nudge after a run of Noes.

export interface CurrentPromise {
	readonly planActionId: string | null
	readonly wording: string
	readonly moment: PromiseMoment
}

export interface PromiseSelection {
	readonly moment: PromiseMoment
	readonly actionId?: string
	readonly typed?: string
}

export interface PlanChoice {
	readonly id: string
	readonly wording: string
}

/** The current Promise, moment and all, so keeping it is one tap. */
export const preSelected = (current: CurrentPromise): PromiseSelection => ({
	moment: current.moment,
	...(current.planActionId == null
		? { typed: current.wording }
		: { actionId: current.planActionId })
})

/** Each Action at the Size its next Promise would be made at. */
export async function planChoices(
	userId: string
): Promise<{ actions: PlanChoice[]; nudge: PromiseNudge | null }> {
	const [plan, history] = await Promise.all([
		getPlan(userId),
		readPromiseHistory({ client: db, userId })
	])
	return {
		actions: plan.actions.map(({ id, sizes }) => ({
			id,
			wording: sizes[workedOutSize({ history, actionId: id })]
		})),
		nudge: promiseNudge({ history, planActionIds: plan.actions.map(({ id }) => id) })
	}
}

/** The commit step's starting point: the current Promise, or an offered Action in its place. */
export function commitSelection({
	current,
	nudge
}: {
	current: CurrentPromise | null
	nudge: PromiseNudge | null
}): PromiseSelection | undefined {
	if (current == null) return undefined
	return {
		...preSelected(current),
		...(nudge?.kind === 'differentAction' && { actionId: nudge.actionId })
	}
}

/** Changing today's Promise: its own Action stays as committed, whatever a Report changed since. */
export function changeChoices({
	actions,
	promise
}: {
	actions: readonly PlanChoice[]
	promise: CurrentPromise
}): PlanChoice[] {
	return actions.map((action) =>
		action.id === promise.planActionId ? { ...action, wording: promise.wording } : action
	)
}
