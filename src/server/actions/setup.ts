'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { promiseChoice } from '@/lib/promise'
import { reminderTime } from '@/lib/reminder'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { addReminder } from '@/server/setup/add-reminder'
import { commitFirstPromise } from '@/server/setup/commit-first-promise'
import { readSetupStep, saveStubStep } from '@/server/setup/stub-progress'
import { saveFailedMessage, validatedAction } from './validated-action'

const finishStubStep = validatedAction({
	input: z.object({ userId: z.uuid(), step: z.literal('keyIdea') }),
	handler: async ({ userId, step }) => {
		// A step only counts as the one the user is on, so a double tap can't skip the next.
		if ((await readSetupStep(userId)) !== step) return
		await saveStubStep({ userId, step })
	}
})

// TEMPORARY, with the stub step it serves (src/server/setup/stub-progress.ts).
// If it fails, the same step comes back with a message saying it wasn't saved.
export async function continueSetup(formData: FormData): Promise<void> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const result = await finishStubStep({ userId: user.id, step: formData.get('step') })
	return redirect({
		href: result.ok ? '/setup' : { pathname: '/setup', query: { [SAVE_FAILED_PARAM]: '1' } },
		locale
	})
}

export interface PromiseFormState {
	readonly error: string | null
}

const commit = validatedAction({
	input: z.object({ userId: z.uuid(), choice: promiseChoice }),
	handler: async ({ userId, choice }) => {
		// Only from the promise step, so nobody commits around an unconfirmed plan.
		if ((await readSetupStep(userId)) !== 'promise') return
		await commitFirstPromise({ userId, choice })
	}
})

export async function commitPromise(
	_previous: PromiseFormState,
	formData: FormData
): Promise<PromiseFormState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const t = await getTranslations('SetupPage.promise.errors')
	const parsed = promiseChoice.safeParse(Object.fromEntries(formData))
	if (!parsed.success) return { error: t('invalid') }

	const result = await commit({ userId: user.id, choice: parsed.data })
	if (!result.ok) return { error: saveFailedMessage({ result, fallback: t('failed') }) }
	return redirect({ href: '/setup', locale })
}

const saveReminderStep = validatedAction({
	input: z.object({ userId: z.uuid(), time: reminderTime }),
	handler: async ({ userId, time }) => {
		if ((await readSetupStep(userId)) !== 'reminder') return
		await addReminder({ userId, time })
	}
})

/** The form stays on screen after this, so it says what happened rather than redirecting. */
export async function saveReminder(time: string): Promise<{ ok: boolean }> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const { ok } = await saveReminderStep({ userId: user.id, time })
	return { ok }
}
