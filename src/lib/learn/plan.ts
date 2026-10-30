import { z } from 'zod'
import type { KeptDay } from '@/lib/kept-day'
import type { PlanStatus } from '@/lib/setup-step'

// The shape of a plan, and what Learn hands Act (docs/product/tasks.md, "Where
// our halves meet"). The goal planner (#28) parses Gemini's answer with
// generatedPlanSchema, so a plan that reaches the database always has this shape.

export const PLAN_WEEKS = [4, 8, 12] as const
export const KEY_IDEAS_PER_PLAN = 5
export const CHOICES_PER_IDEA = 3

const text = (max: number) => z.string().trim().min(1).max(max)
const actionWording = text(160)

export function generatedPlanSchema({ weeks }: { weeks: number }) {
	return z.strictObject({
		milestones: z
			.array(z.strictObject({ week: z.int().min(1).max(weeks), text: text(200) }))
			.min(2)
			.max(4)
			.refine(
				(milestones) =>
					milestones.every((m, i) => i === 0 || m.week > (milestones[i - 1]?.week ?? 0)),
				{
					message: 'Milestones must run in week order'
				}
			),
		actions: z
			.array(z.strictObject({ small: actionWording, medium: actionWording, large: actionWording }))
			.min(3)
			.max(5),
		keyIdeas: z
			.array(
				z.strictObject({
					title: text(80),
					lesson: text(1200),
					question: text(300),
					modelAnswer: text(600),
					choices: z.array(text(200)).length(CHOICES_PER_IDEA),
					correctChoice: z
						.int()
						.min(0)
						.max(CHOICES_PER_IDEA - 1)
				})
			)
			.length(KEY_IDEAS_PER_PLAN)
	})
}

export type GeneratedPlan = z.infer<ReturnType<typeof generatedPlanSchema>>

/** The agreed rule: goal saved only once all four goal screens are answered. */
export function planStatusOf({
	goal,
	plan
}: {
	goal: {
		text: string | null
		weeks: number | null
		startingPoint: string | null
		obstacle: string | null
	} | null
	plan?: { confirmedAt: Date | null } | null
}): PlanStatus {
	if (goal == null) return 'no_goal'
	const answers = [goal.text, goal.weeks, goal.startingPoint, goal.obstacle]
	if (answers.some((answer) => answer == null)) return 'no_goal'
	if (plan == null) return 'goal_saved'
	return plan.confirmedAt == null ? 'plan_made' : 'confirmed'
}

export type ActionSize = 'small' | 'medium' | 'large'

/** What getPlan gives Act: the goal, milestones, and actions in Gemini's order. */
export interface PlanForAct {
	readonly goal: { readonly text: string; readonly weeks: number }
	readonly milestones: readonly {
		readonly id: string
		readonly week: number
		readonly text: string
	}[]
	readonly actions: readonly {
		readonly id: string
		readonly position: number
		readonly sizes: Readonly<Record<ActionSize, string>>
	}[]
}

/** Today's key idea to teach. */
export interface Lesson {
	readonly keyIdeaId: string
	readonly title: string
	readonly lesson: string
}

/** A key idea due back today, with its multiple choice fallback. */
export interface DueReview {
	readonly keyIdeaId: string
	readonly title: string
	readonly question: string
	readonly choices: readonly string[]
}

export interface DueMilestone {
	readonly milestoneId: string
	readonly week: number
	readonly text: string
}

export interface RecallGrade {
	readonly score: 0 | 1 | 2
	readonly reason: string
	readonly modelAnswer: string
	readonly isMultipleChoice: boolean
}

/** First and last scores per key idea; ideas with fewer than two recalls are counted, not compared. */
export interface RecallProgress {
	readonly ideas: readonly {
		readonly keyIdeaId: string
		readonly title: string
		readonly first: { readonly score: number; readonly keptDay: KeptDay }
		readonly last: { readonly score: number; readonly keptDay: KeptDay }
	}[]
	readonly leftOut: number
}
