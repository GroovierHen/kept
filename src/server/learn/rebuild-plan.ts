import 'server-only'
import type { GeneratedPlan } from '@/lib/learn/plan'
import { toKeptDay } from '@/lib/kept-day'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'
import { planRows } from './save-plan'

// The one Try again (#30). The retry is claimed before Gemini is called, by
// moving attempts from 1 to 2 only where it is still 1: a double tap or a
// second tab finds nothing to claim, so Gemini is asked once. A failed call
// hands the claim back. The new plan replaces the old one in one transaction,
// and only while the plan is still unconfirmed.

const retried = { isRetryable: isTransientDbError, onRetry: logDbRetry }

/** Takes the user's one Try again. False when it's used, or the plan is confirmed. */
export async function claimRebuild(userId: string): Promise<boolean> {
	const { count } = await withRetry(
		() =>
			db.plan.updateMany({
				where: { userId, attempts: 1, confirmedAt: null },
				data: { attempts: 2 }
			}),
		retried
	)
	return count === 1
}

/** Gives the Try again back after Gemini failed, so the person can use it later. */
export async function releaseRebuild(userId: string): Promise<void> {
	await withRetry(
		() =>
			db.plan.updateMany({
				where: { userId, attempts: 2, confirmedAt: null },
				data: { attempts: 1 }
			}),
		retried
	)
}

/**
 * Swaps the plan's milestones, actions and key ideas for the new ones and
 * records plan_generated build 2. False, changing nothing, if the plan was
 * confirmed while Gemini was writing: the confirmed plan stands.
 */
export function replacePlan({
	userId,
	plan,
	model
}: {
	userId: string
	plan: GeneratedPlan
	model: string
}): Promise<boolean> {
	const rows = planRows(plan)
	return withRetry(
		() =>
			db.$transaction(
				async (tx) => {
					const { count } = await tx.plan.updateMany({
						where: { userId, attempts: 2, confirmedAt: null },
						data: { model }
					})
					if (count === 0) return false
					const { id: planId, user } = await tx.plan.findUniqueOrThrow({
						where: { userId },
						select: { id: true, user: { select: { timeZone: true } } }
					})
					await tx.milestone.deleteMany({ where: { planId } })
					await tx.planAction.deleteMany({ where: { planId } })
					await tx.keyIdea.deleteMany({ where: { planId } })
					await tx.milestone.createMany({
						data: rows.milestones.map((row) => ({ planId, ...row }))
					})
					await tx.planAction.createMany({ data: rows.actions.map((row) => ({ planId, ...row })) })
					await tx.keyIdea.createMany({ data: rows.keyIdeas.map((row) => ({ planId, ...row })) })
					await recordEvent({
						tx,
						event: {
							userId,
							name: 'plan_generated',
							keptDay: toKeptDay({ instant: new Date(), timeZone: user.timeZone }),
							details: { build: 2 },
							idempotencyKey: 'plan_generated:2'
						}
					})
					return true
				},
				{ isolationLevel: 'Serializable' }
			),
		retried
	)
}
