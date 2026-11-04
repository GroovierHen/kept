import 'server-only'
import type { PlanBuildResult } from '@kept/contract'
import { completeGoal } from '@/lib/learn/goal'
import { captureError } from '@/lib/observability/capture-error'
import { claimBuild, releaseBuild } from './claim-build'
import { generatePlan, PLANNER_MODEL } from './generate-plan'
import { getGoal, getPlanStatus } from './learn'
import { outcomeOf } from './plan-outcome'
import { claimRebuild, getPlanToReplace, releaseRebuild, replacePlan } from './rebuild-plan'
import { savePlan } from './save-plan'

// The plan step's two AI calls (#30), for the web's server actions and the
// app's routes alike. Building only happens while the goal is complete, no
// plan exists and no build is running: the build is claimed first, so a
// repeat, a refresh or a second device waits for it instead of building twice.

/** Makes the first plan. `skipped`: nothing to build, or another build has it. */
export async function runPlanBuild(userId: string): Promise<PlanBuildResult> {
	const [status, answers] = await Promise.all([getPlanStatus(userId), getGoal(userId)])
	const goal = completeGoal(answers)
	if (status !== 'goal_saved' || goal == null || !(await claimBuild(userId))) {
		return { kind: 'skipped' }
	}

	const outcome = outcomeOf(await generatePlan({ userId, goal }))
	try {
		if ('state' in outcome) {
			if (outcome.report != null) captureError(outcome.report)
			// A stuck claim only delays a retry until it goes stale; the
			// person's answer (a safer goal, a reword) still matters more.
			await releaseBuild(userId).catch(captureError)
			return outcome.state.kind === 'idle' ? { kind: 'failed' } : outcome.state
		}
		await savePlan({ userId, goal, plan: outcome.save, model: PLANNER_MODEL })
	} catch (error) {
		captureError(error)
		await releaseBuild(userId).catch(captureError)
		return { kind: 'failed' }
	}
	return { kind: 'saved' }
}

/**
 * The one Try again, which sends the plan the person has so the new one
 * differs. Every way it fails leaves the first plan in place and gives the
 * Try again back; an AI fault is reported.
 */
export async function runPlanRebuild(userId: string): Promise<PlanBuildResult> {
	const [answers, previous] = await Promise.all([getGoal(userId), getPlanToReplace(userId)])
	const goal = completeGoal(answers)
	if (goal == null || previous == null || !(await claimRebuild(userId))) {
		return { kind: 'skipped' }
	}

	const outcome = outcomeOf(await generatePlan({ userId, goal, previous }))
	try {
		if ('state' in outcome) {
			if (outcome.report != null) captureError(outcome.report)
			await releaseRebuild(userId)
			return { kind: 'failed' }
		}
		await replacePlan({ userId, plan: outcome.save, model: PLANNER_MODEL })
	} catch (error) {
		captureError(error)
		await releaseRebuild(userId).catch(captureError)
		return { kind: 'failed' }
	}
	return { kind: 'saved' }
}
