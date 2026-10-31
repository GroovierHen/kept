import { z } from 'zod'
import {
	GOAL_QUESTIONS,
	MAX_GOAL_ANSWER_LENGTH,
	PLAN_WEEKS,
	type GoalQuestion
} from './goal-questions'

// The four goal screens in setup (#29): one question each, saved as it's
// answered, so the next one asked is always the first still unanswered.
// All four together are what the planner sends to Gemini.

export type GoalAnswers = { [Q in GoalQuestion]: Q extends 'weeks' ? number | null : string | null }

/** The first unanswered question, or null once all four are answered. */
export function nextGoalQuestion(goal: GoalAnswers | null): GoalQuestion | null {
	if (goal == null) return 'text'
	return GOAL_QUESTIONS.find((question) => goal[question] == null) ?? null
}

const writtenAnswer = z.string().trim().min(1).max(MAX_GOAL_ANSWER_LENGTH)

// A form sends weeks as text: whole digits only, then one of 4, 8 or 12.
const weeksAnswer = z.string().regex(/^\d+$/).transform(Number).pipe(z.literal(PLAN_WEEKS))

export const goalAnswer = z.discriminatedUnion('question', [
	z.strictObject({ question: z.literal('text'), answer: writtenAnswer }),
	z.strictObject({ question: z.literal('weeks'), answer: weeksAnswer }),
	z.strictObject({ question: z.literal('startingPoint'), answer: writtenAnswer }),
	z.strictObject({ question: z.literal('obstacle'), answer: writtenAnswer })
])

export type GoalAnswer = z.output<typeof goalAnswer>
