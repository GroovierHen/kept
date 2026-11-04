import 'server-only'
import type { SetupResponse, SetupView } from '@kept/contract'
import { nextGoalQuestion } from '@/lib/learn/goal'
import { isBuildRunning } from '@/lib/learn/plan-build'
import { SETUP_STEPS } from '@/lib/setup-step'
import { getBuildState } from '@/server/learn/claim-build'
import {
	getGoal,
	getPlan,
	getPlanDraft,
	getPlanStatus,
	getTodaysLesson
} from '@/server/learn/learn'
import { keptDayFor } from '@/server/learn/teach-lesson'
import { readSetupStep } from './progress'

/**
 * The app's setup screen: the first unfinished step and what it shows, read
 * the way the web's setup page reads each step's component
 * (src/app/[locale]/setup, src/components/{learn,setup}).
 */
export async function readSetupView(userId: string): Promise<SetupResponse> {
	return { steps: [...SETUP_STEPS], view: await viewOf(userId) }
}

async function viewOf(userId: string): Promise<SetupView> {
	const step = await readSetupStep(userId)
	switch (step) {
		case null:
			return { step: 'done' }
		case 'goal': {
			const goal = await getGoal(userId)
			return {
				step,
				question: nextGoalQuestion(goal) ?? 'text',
				answers: {
					text: goal?.text ?? null,
					weeks: goal?.weeks ?? null,
					startingPoint: goal?.startingPoint ?? null,
					obstacle: goal?.obstacle ?? null
				}
			}
		}
		case 'plan':
			return { step, plan: await planView(userId) }
		case 'keyIdea': {
			const lesson = await getTodaysLesson(userId, await keptDayFor(userId))
			return { step, lesson }
		}
		case 'promise': {
			const plan = await getPlan(userId)
			return {
				step,
				actions: plan.actions.map(({ id, sizes }) => ({ id, wording: sizes.small }))
			}
		}
		case 'reminder':
			return { step }
	}
}

async function planView(userId: string): Promise<Extract<SetupView, { step: 'plan' }>['plan']> {
	const status = await getPlanStatus(userId)
	if (status === 'plan_made') {
		const draft = await getPlanDraft(userId)
		if (draft != null) return { status, draft }
	}
	const { goalText, startedAt } = await getBuildState(userId)
	return {
		status: 'goal_saved',
		goalText,
		isBuilding: startedAt != null && isBuildRunning({ startedAt, now: new Date() })
	}
}
