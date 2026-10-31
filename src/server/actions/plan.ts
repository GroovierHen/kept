'use server'

import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { completeGoal } from '@/lib/learn/goal'
import { captureError } from '@/lib/observability/capture-error'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { markPlanConfirmed } from '@/server/learn/confirm-plan'
import { generatePlan, PLANNER_MODEL } from '@/server/learn/generate-plan'
import { getGoal, getPlanStatus } from '@/server/learn/learn'
import { outcomeOf, type BuildPlanState } from '@/server/learn/plan-outcome'
import { savePlan } from '@/server/learn/save-plan'
import { validatedAction } from './validated-action'

// The plan step (#30). Building only happens from the button, after the person
// has seen that their goal goes to Gemini, and only while the goal is complete
// and no plan exists: a repeat, a refresh or a second tab can't build twice.

// Used with useActionState, which also passes the previous state and the
// form; building needs neither.
export async function buildPlan(): Promise<BuildPlanState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const [status, answers] = await Promise.all([getPlanStatus(user.id), getGoal(user.id)])
	const goal = completeGoal(answers)
	if (status !== 'goal_saved' || goal == null) return redirect({ href: '/setup', locale })

	const outcome = outcomeOf(await generatePlan({ userId: user.id, goal }))
	if ('state' in outcome) {
		if (outcome.report != null) captureError(outcome.report)
		return outcome.state
	}

	try {
		await savePlan({ userId: user.id, goal, plan: outcome.save, model: PLANNER_MODEL })
	} catch (error) {
		captureError(error)
		return { kind: 'failed' }
	}
	return redirect({ href: '/setup', locale })
}

const confirm = validatedAction({
	input: z.object({ userId: z.uuid() }),
	handler: ({ userId }) => markPlanConfirmed(userId)
})

export async function confirmPlan(): Promise<void> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const result = await confirm({ userId: user.id })
	return redirect({
		href: result.ok ? '/setup' : { pathname: '/setup', query: { [SAVE_FAILED_PARAM]: '1' } },
		locale
	})
}
