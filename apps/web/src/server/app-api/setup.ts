import 'server-only'
import type { endpoints } from '@kept/contract'
import type { AppRouteHandler } from '@/server/api/app-handler'
import { markPlanConfirmed } from '@/server/learn/confirm-plan'
import { removePlanAction, updatePlanAction } from '@/server/learn/edit-plan'
import { runPlanBuild, runPlanRebuild } from '@/server/learn/run-plan-build'
import { saveGoalAnswer as saveAnswer } from '@/server/learn/save-goal-answer'
import { readSetupView } from '@/server/setup/read-setup-view'
import {
	commitSetupPromise,
	learnFirstKeyIdea as learnFirst,
	saveSetupReminder
} from '@/server/setup/step-writes'

// Setup for the app, each write the same function the web's server action
// calls (src/server/actions/{goal,plan,learn,setup}.ts). Out of step, a write
// does nothing and answers saved: the app reads setup again for what's true.

const SAVED = { ok: true } as const

export const getSetup: AppRouteHandler<typeof endpoints.getSetup> = ({ user }) =>
	readSetupView(user.id)

export const saveGoalAnswer: AppRouteHandler<typeof endpoints.saveGoalAnswer> = async ({
	user,
	body
}) => {
	await saveAnswer({ userId: user.id, answer: body })
	return SAVED
}

export const buildPlan: AppRouteHandler<typeof endpoints.buildPlan> = ({ user }) =>
	runPlanBuild(user.id)

export const rebuildPlan: AppRouteHandler<typeof endpoints.rebuildPlan> = ({ user }) =>
	runPlanRebuild(user.id)

export const editPlanAction: AppRouteHandler<typeof endpoints.editPlanAction> = async ({
	user,
	body
}) => ({
	result:
		body.intent === 'save'
			? await updatePlanAction({ userId: user.id, actionId: body.actionId, sizes: body.sizes })
			: await removePlanAction({ userId: user.id, actionId: body.actionId })
})

export const confirmPlan: AppRouteHandler<typeof endpoints.confirmPlan> = async ({ user }) => {
	await markPlanConfirmed(user.id)
	return SAVED
}

export const learnFirstKeyIdea: AppRouteHandler<typeof endpoints.learnFirstKeyIdea> = async ({
	user,
	body
}) => {
	await learnFirst({ userId: user.id, keyIdeaId: body.keyIdeaId })
	return SAVED
}

export const commitFirstPromise: AppRouteHandler<typeof endpoints.commitFirstPromise> = async ({
	user,
	body
}) => {
	await commitSetupPromise({ userId: user.id, choice: body })
	return SAVED
}

export const saveReminder: AppRouteHandler<typeof endpoints.saveReminder> = async ({
	user,
	body
}) => {
	await saveSetupReminder({ userId: user.id, time: body.time })
	return SAVED
}
