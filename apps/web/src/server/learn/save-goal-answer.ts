import 'server-only'
import { getTranslations } from 'next-intl/server'
import { AppError } from '@/lib/errors/app-error'
import type { GoalAnswer } from '@/lib/learn/goal'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, isUniqueViolation, logDbRetry } from '@/server/db/transient-error'

// Saves one goal screen's answer (#29). Answering a question again just
// overwrites it, so a double tap or a resubmit is harmless. Once a plan
// exists the goal is locked, because the plan was made from these answers.

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

export async function saveGoalAnswer({
	userId,
	answer
}: {
	userId: string
	answer: GoalAnswer
}): Promise<void> {
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
