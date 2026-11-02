'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import type { RecallGrade } from '@/lib/learn/plan'
import { captureError } from '@/lib/observability/capture-error'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { gradeChoice, gradeRecall } from '@/server/learn/grade-recall'
import { MAX_RECALL_ANSWER_LENGTH } from '@/server/learn/grader'
import { keptDayFor, teachLesson } from '@/server/learn/teach-lesson'
import { readSetupStep } from '@/server/setup/progress'
import { validatedAction } from './validated-action'

// Setup's key idea step (#31): Continue means the person has read it, so it
// counts as taught. If saving fails, the same lesson comes back saying so.

const learnFirst = validatedAction({
	input: z.object({ userId: z.uuid(), keyIdeaId: z.uuid() }),
	handler: async ({ userId, keyIdeaId }) => {
		// Only from the key idea step, so a stale tab can't teach around setup.
		if ((await readSetupStep(userId)) !== 'keyIdea') return
		await teachLesson({ userId, keyIdeaId, keptDay: await keptDayFor(userId) })
	}
})

export async function learnFirstKeyIdea(formData: FormData): Promise<void> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const result = await learnFirst({ userId: user.id, keyIdeaId: formData.get('keyIdeaId') })
	return redirect({
		href: result.ok ? '/setup' : { pathname: '/setup', query: { [SAVE_FAILED_PARAM]: '1' } },
		locale
	})
}

// Recall on the Today screen (#32). A typed answer goes to Gemini; if Gemini
// can't mark it, the card turns into multiple choice for the same question.
export type RecallState =
	| { readonly kind: 'typing'; readonly error: string | null }
	| { readonly kind: 'choosing'; readonly error: string | null }
	| { readonly kind: 'graded'; readonly grade: RecallGrade }

const recallInput = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('typed'),
		keyIdeaId: z.uuid(),
		answer: z.string().max(MAX_RECALL_ANSWER_LENGTH)
	}),
	z.object({
		mode: z.literal('choice'),
		keyIdeaId: z.uuid(),
		choice: z.string().regex(/^\d$/).transform(Number)
	})
])

const answer = validatedAction({
	input: z.object({ userId: z.uuid(), recall: recallInput }),
	handler: ({ userId, recall }) =>
		recall.mode === 'typed'
			? gradeRecall(userId, recall.keyIdeaId, recall.answer)
			: gradeChoice(userId, recall.keyIdeaId, recall.choice)
})

export async function answerRecall(
	previous: RecallState,
	formData: FormData
): Promise<RecallState> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const t = await getTranslations('Learn.recall.errors')
	const parsed = recallInput.safeParse(Object.fromEntries(formData))
	if (!parsed.success) {
		const error = formData.get('mode') === 'choice' ? t('choose') : t('tooLong')
		return { kind: stillAsking(previous), error }
	}

	const result = await answer({ userId: user.id, recall: Object.fromEntries(formData) })
	if (!result.ok) return { kind: stillAsking(previous), error: t('failed') }

	const outcome = result.data
	if (outcome.kind === 'not_due') return redirect({ href: '/today', locale })
	if (outcome.kind === 'multiple_choice') {
		captureError(outcome.error)
		return { kind: 'choosing', error: null }
	}
	return { kind: 'graded', grade: outcome.grade }
}

// A failed submit keeps the person on the form they were using.
function stillAsking(previous: RecallState): 'typing' | 'choosing' {
	return previous.kind === 'choosing' ? 'choosing' : 'typing'
}
