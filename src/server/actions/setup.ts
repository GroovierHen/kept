'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { promiseChoice } from '@/lib/promise'
import { reminderTime } from '@/lib/reminder'
import { getSignedInUser } from '@/server/auth/session'
import { addReminder } from '@/server/setup/add-reminder'
import { commitFirstPromise } from '@/server/setup/commit-first-promise'
import { readSetupStep } from '@/server/setup/progress'
import { validatedAction } from './validated-action'

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
	if (!result.ok) return { error: result.status >= 500 ? t('failed') : result.error }
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
