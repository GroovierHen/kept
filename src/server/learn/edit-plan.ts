import 'server-only'
import type { ActionSize } from '@/lib/learn/plan'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'

// Rewording or removing one action of a plan the user hasn't confirmed (#30).
// Both run Serializable, as does Confirm: Postgres aborts one of two that
// overlap, withRetry runs it again on fresh data, and so two removes in two
// tabs can't leave a plan with no actions, and nothing changes once confirmed.

export type PlanEditResult = 'saved' | 'locked' | 'last_action'

const SERIALIZABLE = { isolationLevel: 'Serializable' } as const

/** Rewords an action. One already gone counts as saved: the person removed it in another tab. */
export function updatePlanAction({
	userId,
	actionId,
	sizes
}: {
	userId: string
	actionId: string
	sizes: Readonly<Record<ActionSize, string>>
}): Promise<PlanEditResult> {
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const plan = await tx.plan.findUnique({
					where: { userId },
					select: { id: true, confirmedAt: true }
				})
				if (plan == null || plan.confirmedAt != null) return 'locked'
				await tx.planAction.updateMany({ where: { id: actionId, planId: plan.id }, data: sizes })
				return 'saved'
			}, SERIALIZABLE),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}

/** Removes an action, keeping at least one. A second tap finds it gone and changes nothing. */
export function removePlanAction({
	userId,
	actionId
}: {
	userId: string
	actionId: string
}): Promise<PlanEditResult> {
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const plan = await tx.plan.findUnique({
					where: { userId },
					select: { id: true, confirmedAt: true, _count: { select: { actions: true } } }
				})
				if (plan == null || plan.confirmedAt != null) return 'locked'
				if (plan._count.actions <= 1) return 'last_action'
				await tx.planAction.deleteMany({ where: { id: actionId, planId: plan.id } })
				return 'saved'
			}, SERIALIZABLE),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}
