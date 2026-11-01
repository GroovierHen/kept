'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { promiseChoice } from '@/lib/promise'
import { reportSubmission } from '@/lib/report'
import { getSignedInUser } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { changePromise } from '@/server/today/change-promise'
import { commitNextPromise } from '@/server/today/commit-next-promise'
import { makeReport } from '@/server/today/make-report'
import { readCheckIn } from '@/server/today/read-check-in'
import { teachLesson } from '@/server/learn/teach-lesson'
import type { PromiseFormState } from './setup'
import { saveFailedMessage, validatedAction } from './validated-action'

async function requireSignedIn() {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })
	return { user, locale }
}

export interface ReportFormState {
	readonly error: string | null
}

const saveReport = validatedAction({
	input: reportSubmission.extend({ userId: z.uuid() }),
	handler: makeReport
})

export async function submitReport(
	_previous: ReportFormState,
	formData: FormData
): Promise<ReportFormState> {
	const { user, locale } = await requireSignedIn()

	const t = await getTranslations('TodayPage.report.errors')
	const parsed = reportSubmission.safeParse(Object.fromEntries(formData))
	if (!parsed.success) return { error: t('invalid') }

	const result = await saveReport({ userId: user.id, ...parsed.data })
	if (!result.ok) return { error: saveFailedMessage({ result, fallback: t('failed') }) }
	return redirect({ href: '/today', locale })
}

const learn = validatedAction({
	input: z.object({ userId: z.uuid(), keyIdeaId: z.uuid() }),
	handler: async ({ userId, keyIdeaId }) => {
		const { today } = await readCheckIn({ client: db, userId })
		await teachLesson({ userId, keyIdeaId, keptDay: today })
	}
})

// If saving fails, the same lesson comes back, since it still isn't taught.
export async function finishLearning(formData: FormData): Promise<void> {
	const { user, locale } = await requireSignedIn()

	await learn({ userId: user.id, keyIdeaId: formData.get('keyIdeaId') })
	return redirect({ href: '/today', locale })
}

const saveNextPromise = validatedAction({
	input: z.object({ userId: z.uuid(), choice: promiseChoice }),
	handler: commitNextPromise
})

export async function submitNextPromise(
	_previous: PromiseFormState,
	formData: FormData
): Promise<PromiseFormState> {
	const { user, locale } = await requireSignedIn()

	const t = await getTranslations('SetupPage.promise.errors')
	const parsed = promiseChoice.safeParse(Object.fromEntries(formData))
	if (!parsed.success) return { error: t('invalid') }

	const result = await saveNextPromise({ userId: user.id, choice: parsed.data })
	if (!result.ok) return { error: saveFailedMessage({ result, fallback: t('failed') }) }
	return redirect({ href: '/today', locale })
}

const promiseChangeIds = z.object({ promiseId: z.uuid(), changeId: z.uuid() })

const savePromiseChange = validatedAction({
	input: promiseChangeIds.extend({ userId: z.uuid(), choice: promiseChoice }),
	handler: changePromise
})

// The page binds the ids, so the form stays the same one that made the Promise.
export async function submitPromiseChange(
	ids: z.infer<typeof promiseChangeIds>,
	_previous: PromiseFormState,
	formData: FormData
): Promise<PromiseFormState> {
	const { user, locale } = await requireSignedIn()

	const t = await getTranslations('SetupPage.promise.errors')
	const parsed = promiseChoice.safeParse(Object.fromEntries(formData))
	if (!parsed.success) return { error: t('invalid') }

	const result = await savePromiseChange({ ...ids, userId: user.id, choice: parsed.data })
	if (!result.ok) return { error: saveFailedMessage({ result, fallback: t('failed') }) }
	return redirect({ href: '/today', locale })
}
