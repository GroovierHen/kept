'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { completeGoal } from '@/lib/learn/goal'
import { planActionEdit } from '@/lib/learn/plan'
import { captureError } from '@/lib/observability/capture-error'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { markPlanConfirmed } from '@/server/learn/confirm-plan'
import { removePlanAction, updatePlanAction } from '@/server/learn/edit-plan'
import { generatePlan, PLANNER_MODEL } from '@/server/learn/generate-plan'
import { getGoal, getPlanStatus } from '@/server/learn/learn'
import { outcomeOf, type BuildPlanState } from '@/server/learn/plan-outcome'
import { claimBuild, releaseBuild } from '@/server/learn/claim-build'
import {
	claimRebuild,
	getPlanToReplace,
	releaseRebuild,
	replacePlan
} from '@/server/learn/rebuild-plan'
import { savePlan } from '@/server/learn/save-plan'
import { validatedAction } from './validated-action'

// The plan step (#30). Building only happens from the button, after the person
// has seen where their goal goes, and only while the goal is complete, no plan
// exists and no build is running: the build is claimed first, so a repeat, a
// refresh or a second tab waits for it instead of building twice.
// Until Confirm, the person can reword or remove actions and Try again once.

// Used with useActionState, which also passes the previous state and the
// form; building needs neither.
export async function buildPlan(): Promise<BuildPlanState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const [status, answers] = await Promise.all([getPlanStatus(user.id), getGoal(user.id)])
	const goal = completeGoal(answers)
	if (status !== 'goal_saved' || goal == null || !(await claimBuild(user.id))) {
		return redirect({ href: '/setup', locale })
	}

	const outcome = outcomeOf(await generatePlan({ userId: user.id, goal }))
	try {
		if ('state' in outcome) {
			if (outcome.report != null) captureError(outcome.report)
			// A stuck claim only delays a retry until it goes stale; the
			// person's answer (a safer goal, a reword) still matters more.
			await releaseBuild(user.id).catch(captureError)
			return outcome.state
		}
		await savePlan({ userId: user.id, goal, plan: outcome.save, model: PLANNER_MODEL })
	} catch (error) {
		captureError(error)
		await releaseBuild(user.id).catch(captureError)
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

// Like buildPlan, for the one Try again, which sends the plan the person has
// so the new one differs. Every way it fails leaves the first plan in place
// and gives the Try again back; an AI fault is reported.
export async function rebuildPlan(): Promise<BuildPlanState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const [answers, previous] = await Promise.all([getGoal(user.id), getPlanToReplace(user.id)])
	const goal = completeGoal(answers)
	if (goal == null || previous == null || !(await claimRebuild(user.id))) {
		return redirect({ href: '/setup', locale })
	}

	const outcome = outcomeOf(await generatePlan({ userId: user.id, goal, previous }))
	try {
		if ('state' in outcome) {
			if (outcome.report != null) captureError(outcome.report)
			await releaseRebuild(user.id)
			return { kind: 'failed' }
		}
		await replacePlan({ userId: user.id, plan: outcome.save, model: PLANNER_MODEL })
	} catch (error) {
		captureError(error)
		await releaseRebuild(user.id).catch(captureError)
		return { kind: 'failed' }
	}
	return redirect({ href: '/setup', locale })
}

export interface ActionEditState {
	readonly error: string | null
}

const editAction = validatedAction({
	input: z.object({ userId: z.uuid(), edit: planActionEdit }),
	handler: ({ userId, edit }) =>
		edit.intent === 'save'
			? updatePlanAction({ userId, actionId: edit.actionId, sizes: edit.sizes })
			: removePlanAction({ userId, actionId: edit.actionId })
})

// Used with useActionState; the button pressed sends intent, save or remove.
export async function editPlanAction(
	_previous: ActionEditState,
	formData: FormData
): Promise<ActionEditState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const t = await getTranslations('Learn.plan.edit.errors')
	const intent = formData.get('intent')
	const edit = {
		intent,
		actionId: formData.get('actionId'),
		...(intent === 'save' && {
			sizes: {
				small: formData.get('small'),
				medium: formData.get('medium'),
				large: formData.get('large')
			}
		})
	}
	if (!planActionEdit.safeParse(edit).success) return { error: t('empty') }

	const result = await editAction({ userId: user.id, edit })
	if (!result.ok) return { error: t('failed') }
	if (result.data === 'last_action') return { error: t('lastAction') }
	// Saved, or locked by a Confirm in another tab: either way setup shows what's true now.
	return redirect({ href: '/setup', locale })
}
