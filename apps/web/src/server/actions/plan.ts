'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { planActionEdit } from '@/lib/learn/plan'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { markPlanConfirmed } from '@/server/learn/confirm-plan'
import { removePlanAction, updatePlanAction } from '@/server/learn/edit-plan'
import type { BuildPlanState } from '@/server/learn/plan-outcome'
import { runPlanBuild, runPlanRebuild } from '@/server/learn/run-plan-build'
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

	const result = await runPlanBuild(user.id)
	if (result.kind === 'saved' || result.kind === 'skipped')
		return redirect({ href: '/setup', locale })
	return result
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

// Like buildPlan, for the one Try again (src/server/learn/run-plan-build.ts).
export async function rebuildPlan(): Promise<BuildPlanState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const result = await runPlanRebuild(user.id)
	if (result.kind === 'saved' || result.kind === 'skipped')
		return redirect({ href: '/setup', locale })
	return { kind: 'failed' }
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
