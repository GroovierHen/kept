import 'server-only'
import { oldestLiveClaim } from '@/lib/learn/plan-build'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'

// The first plan's build, claimed on the goal before the AI is called, like
// Try again's claim in rebuild-plan.ts. A double tap, a refresh or a second
// tab finds nothing to claim and waits for the plan instead of paying for a
// second one. A failed build hands the claim back; a saved plan makes it moot.

const retried = { isRetryable: isTransientDbError, onRetry: logDbRetry }

/** Takes the build. False when one is running, or a plan already exists. */
export async function claimBuild(userId: string): Promise<boolean> {
	const now = new Date()
	const { count } = await withRetry(
		() =>
			db.goal.updateMany({
				where: {
					userId,
					plan: { is: null },
					OR: [{ planBuildStartedAt: null }, { planBuildStartedAt: { lte: oldestLiveClaim(now) } }]
				},
				data: { planBuildStartedAt: now }
			}),
		retried
	)
	return count === 1
}

/** Gives the build back after the AI failed, so the person can press it again. */
export async function releaseBuild(userId: string): Promise<void> {
	await withRetry(
		() => db.goal.updateMany({ where: { userId }, data: { planBuildStartedAt: null } }),
		retried
	)
}

/** The goal's wording and when its build was claimed, if ever; the caller decides if that is stale. */
export async function getBuildState(
	userId: string
): Promise<{ goalText: string; startedAt: Date | null }> {
	const goal = await withRetry(
		() =>
			db.goal.findUnique({ where: { userId }, select: { text: true, planBuildStartedAt: true } }),
		retried
	)
	return { goalText: goal?.text ?? '', startedAt: goal?.planBuildStartedAt ?? null }
}
