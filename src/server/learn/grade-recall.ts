import 'server-only'
import { z } from 'zod'
import { keptDayDate, keptDayFromDate, type KeptDay } from '@/lib/kept-day'
import type { RecallGrade } from '@/lib/learn/plan'
import { nextReturn, type RecallScore } from '@/lib/learn/review-schedule'
import { withRetry } from '@/lib/retry'
import { chatCompletion } from '@/server/ai/openrouter'
import { db } from '@/server/db/client'
import { isTransientDbError, isUniqueViolation, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'
import { PLANNER_MODEL } from './generate-plan'
import { gradeAnswer, MAX_RECALL_ANSWER_LENGTH } from './grader'
import { FLAGGED } from './planner'
import { getDueReviews } from './learn'
import { keptDayFor } from './teach-lesson'

// Answering a key idea that came back (#32). Only an idea in today's due
// reviews can be answered, so the 2 a day cap holds on the server too. Each
// answer saves once, keyed by its review, with its next return and its
// recall_graded Event in the same transaction (ADR 0001).

// The same model as the planner: it passed every grader case in the benchmark
// (docs/adr/0003).
const GRADER_MODEL = PLANNER_MODEL

const recallScore = z.union([z.literal(0), z.literal(1), z.literal(2)])

export type RecallOutcome =
	| { kind: 'graded'; grade: RecallGrade }
	// error is what to report; a blocked answer has none, since it isn't a fault.
	| { kind: 'multiple_choice'; error?: unknown }
	| { kind: 'not_due' }

/** Marks a typed answer with the AI. If it can't, asks for multiple choice and saves nothing. */
export async function gradeRecall(
	userId: string,
	keyIdeaId: string,
	answer: string
): Promise<RecallOutcome> {
	const keptDay = await keptDayFor(userId)
	const due = await findDue({ userId, keyIdeaId, keptDay })
	if (due.kind !== 'due') return due.outcome

	const typed = answer.trim().slice(0, MAX_RECALL_ANSWER_LENGTH)
	if (typed === '') {
		return saveRecall({
			due,
			keptDay,
			answer: '',
			score: 0,
			reason: 'No answer was given.',
			isMultipleChoice: false
		})
	}

	const result = await gradeAnswer({
		recall: { question: due.idea.question, modelAnswer: due.idea.modelAnswer, answer: typed },
		ask: async ({ prompt, responseJsonSchema }) => {
			const reply = await chatCompletion(
				{ feature: 'recall_grade', model: GRADER_MODEL, meta: { user_id: userId } },
				{
					messages: [{ role: 'user', content: prompt }],
					jsonSchema: { name: 'recall_mark', schema: responseJsonSchema }
				}
			)
			return reply.kind === 'flagged' ? FLAGGED : { text: reply.text }
		}
	})
	if (!result.ok) {
		return {
			kind: 'multiple_choice',
			...(result.reason === 'unavailable' && { error: result.error })
		}
	}
	return saveRecall({ due, keptDay, answer: typed, ...result, isMultipleChoice: false })
}

/** The multiple choice fallback: the right option scores 1, any other 0. */
export async function gradeChoice(
	userId: string,
	keyIdeaId: string,
	choice: number
): Promise<RecallOutcome> {
	const keptDay = await keptDayFor(userId)
	const due = await findDue({ userId, keyIdeaId, keptDay })
	if (due.kind !== 'due') return due.outcome

	const isRight = choice === due.idea.correctChoice
	return saveRecall({
		due,
		keptDay,
		answer: due.idea.choices[choice] ?? '',
		score: isRight ? 1 : 0,
		reason: isRight ? 'Picked the right option.' : 'Picked a wrong option.',
		isMultipleChoice: true
	})
}

type Due = Awaited<ReturnType<typeof readReview>> & { kind: 'due' }

async function findDue({
	userId,
	keyIdeaId,
	keptDay
}: {
	userId: string
	keyIdeaId: string
	keptDay: KeptDay
}): Promise<Due | { kind: 'done'; outcome: RecallOutcome }> {
	const dueToday = await getDueReviews(userId, keptDay)
	if (dueToday.some((review) => review.keyIdeaId === keyIdeaId)) {
		return { kind: 'due', ...(await readReview({ userId, keyIdeaId, keptDay })) }
	}
	// A repeated submit: the first one already answered it today, so show that mark.
	const answered = await db.recallAttempt.findFirst({
		where: { userId, keyIdeaId, keptDay: keptDayDate(keptDay) },
		select: attemptFields
	})
	if (answered == null) return { kind: 'done', outcome: { kind: 'not_due' } }
	return { kind: 'done', outcome: { kind: 'graded', grade: gradeOf(answered) } }
}

async function readReview({
	userId,
	keyIdeaId,
	keptDay
}: {
	userId: string
	keyIdeaId: string
	keptDay: KeptDay
}) {
	const review = await db.review.findFirstOrThrow({
		where: { userId, keyIdeaId, dueOn: { lte: keptDayDate(keptDay) }, recallAttemptId: null },
		select: {
			id: true,
			keyIdea: {
				select: {
					question: true,
					modelAnswer: true,
					choices: true,
					correctChoice: true,
					taughtOn: true
				}
			}
		}
	})
	return { userId, keyIdeaId, reviewId: review.id, idea: review.keyIdea }
}

const attemptFields = {
	score: true,
	reason: true,
	isMultipleChoice: true,
	keyIdea: { select: { modelAnswer: true } }
} as const

function gradeOf(attempt: {
	score: number
	reason: string
	isMultipleChoice: boolean
	keyIdea: { modelAnswer: string }
}): RecallGrade {
	return {
		score: recallScore.parse(attempt.score),
		reason: attempt.reason,
		modelAnswer: attempt.keyIdea.modelAnswer,
		isMultipleChoice: attempt.isMultipleChoice
	}
}

async function saveRecall({
	due,
	keptDay,
	answer,
	score,
	reason,
	isMultipleChoice
}: {
	due: Due
	keptDay: KeptDay
	answer: string
	score: RecallScore
	reason: string
	isMultipleChoice: boolean
}): Promise<RecallOutcome> {
	const { userId, keyIdeaId, reviewId } = due
	const idempotencyKey = `recall:${reviewId}`
	try {
		const grade = await withRetry(
			() =>
				db.$transaction(async (tx) => {
					const attempt = await tx.recallAttempt.create({
						data: {
							userId,
							keyIdeaId,
							keptDay: keptDayDate(keptDay),
							answer,
							score,
							reason,
							isMultipleChoice,
							idempotencyKey
						},
						select: { id: true, ...attemptFields }
					})
					await tx.review.update({ where: { id: reviewId }, data: { recallAttemptId: attempt.id } })

					const [past, idea] = await Promise.all([
						tx.recallAttempt.findMany({
							where: { userId, keyIdeaId },
							select: { keptDay: true, score: true }
						}),
						tx.keyIdea.findUniqueOrThrow({ where: { id: keyIdeaId }, select: { taughtOn: true } })
					])
					const comesBack =
						idea.taughtOn == null
							? null
							: nextReturn({
									taughtOn: keptDayFromDate(idea.taughtOn),
									recalls: past.map((recall) => ({
										keptDay: keptDayFromDate(recall.keptDay),
										score: recallScore.parse(recall.score)
									}))
								})
					if (comesBack != null) {
						await tx.review.create({ data: { userId, keyIdeaId, dueOn: keptDayDate(comesBack) } })
					}

					await recordEvent({
						tx,
						event: {
							userId,
							name: 'recall_graded',
							keptDay,
							details: { keyIdeaId, score, isMultipleChoice },
							idempotencyKey: `recall_graded:${reviewId}`
						}
					})
					return gradeOf(attempt)
				}),
			{ isRetryable: isTransientDbError, onRetry: logDbRetry }
		)
		return { kind: 'graded', grade }
	} catch (error) {
		// Two submits at once: the review's key let one through. Show its mark.
		if (!isUniqueViolation(error)) throw error
		const first = await db.recallAttempt.findUniqueOrThrow({
			where: { userId_idempotencyKey: { userId, idempotencyKey } },
			select: attemptFields
		})
		return { kind: 'graded', grade: gradeOf(first) }
	}
}
