'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { goalAnswer } from '@/lib/learn/goal'
import { getSignedInUser } from '@/server/auth/session'
import { saveGoalAnswer as saveAnswerFor } from '@/server/learn/save-goal-answer'
import { validatedAction } from './validated-action'

// One goal screen's answer (#29), saved by src/server/learn/save-goal-answer.ts.

export interface GoalFormState {
	readonly error: string | null
	readonly answer: string
}

const saveAnswer = validatedAction({
	input: z.object({ userId: z.uuid(), answer: goalAnswer }),
	handler: saveAnswerFor
})

export async function saveGoalAnswer(
	_previous: GoalFormState,
	formData: FormData
): Promise<GoalFormState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const t = await getTranslations('Learn.goal.errors')
	const raw = { question: formData.get('question'), answer: formData.get('answer') }
	const typed = typeof raw.answer === 'string' ? raw.answer : ''

	const parsed = goalAnswer.safeParse(raw)
	if (!parsed.success) {
		if (raw.question === 'weeks') return { error: t('weeks'), answer: typed }
		const tooLong = parsed.error.issues.some((issue) => issue.code === 'too_big')
		return { error: tooLong ? t('tooLong') : t('empty'), answer: typed }
	}

	const result = await saveAnswer({ userId: user.id, answer: raw })
	if (!result.ok) {
		return { error: result.status >= 500 ? t('failed') : result.error, answer: typed }
	}
	return redirect({ href: '/setup', locale })
}
