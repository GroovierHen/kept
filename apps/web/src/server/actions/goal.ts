'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { AppError } from '@/lib/errors/app-error'
import { goalAnswer, type GoalAnswer } from '@/lib/learn/goal'
import { withRetry } from '@/lib/retry'
import { getSignedInUser } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { isTransientDbError, isUniqueViolation, logDbRetry } from '@/server/db/transient-error'
import { validatedAction } from './validated-action'

// Saves one goal screen's answer (#29). Answering a question again just
// overwrites it, so a double tap or a resubmit is harmless. Once a plan
// exists the goal is locked, because the plan was made from these answers.

export interface GoalFormState {
	readonly error: string | null
	readonly answer: string
}

function goalData(answer: GoalAnswer) {
	switch (answer.question) {
		case 'text':
			return { text: answer.answer }
		case 'weeks':
			return { weeks: answer.answer }
		case 'startingPoint':
			return { startingPoint: answer.answer }
		case 'obstacle':
			return { obstacle: answer.answer }
	}
}

// Two first answers at once both try to create the user's goal row; the
// unique userId lets one through and the other retries as an update.
function isRetryable(error: unknown): boolean {
	return isUniqueViolation(error) || isTransientDbError(error)
}

const saveAnswer = validatedAction({
	input: z.object({ userId: z.uuid(), answer: goalAnswer }),
	handler: async ({ userId, answer }) => {
		const t = await getTranslations('Learn.goal.errors')
		const data = goalData(answer)
		await withRetry(
			() =>
				db.$transaction(async (tx) => {
					const plan = await tx.plan.findUnique({ where: { userId }, select: { id: true } })
					if (plan != null) throw new AppError(t('locked'), { status: 409, code: 'goal_locked' })
					await tx.goal.upsert({ where: { userId }, create: { userId, ...data }, update: data })
				}),
			{ isRetryable, onRetry: logDbRetry }
		)
	}
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
