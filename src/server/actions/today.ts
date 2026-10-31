'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { promiseChoice } from '@/lib/promise'
import { reportSubmission } from '@/lib/report'
import { getSignedInUser } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { commitNextPromise } from '@/server/today/commit-next-promise'
import { makeReport } from '@/server/today/make-report'
import { readCheckIn } from '@/server/today/read-check-in'
import { saveLearnedOn } from '@/server/today/stub-learned'
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

// TEMPORARY, with the cookie it saves (src/server/today/stub-learned.ts).
export async function finishLearning(): Promise<void> {
	const { user, locale } = await requireSignedIn()

	const { today } = await readCheckIn({ client: db, userId: user.id })
	await saveLearnedOn({ userId: user.id, today })
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
