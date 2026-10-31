import 'server-only'
import { z } from 'zod'
import { keptDayDate, keptDayOf, type KeptDay } from '@/lib/kept-day'
import {
	planStatusOf,
	type DueMilestone,
	type DueReview,
	type Lesson,
	type PlanForAct,
	type RecallGrade,
	type RecallProgress
} from '@/lib/learn/plan'
import type { GoalAnswers } from '@/lib/learn/goal'
import { MAX_RECALLS_PER_DAY, todaysKeyIdea } from '@/lib/learn/lesson'
import { SARA_GENERATED_PLAN, SARA_GOAL } from '@/lib/learn/sara-plan'
import type { PlanStatus } from '@/lib/setup-step'
import { db } from '@/server/db/client'

// What Learn gives Act (docs/product/tasks.md, "Where our halves meet").
// getPlanStatus, getPlan and getTodaysLesson read the database. The rest are TEMPORARY stubs
// returning Sara's data from the walkthrough, so Act can build against them;
// each names the issue that makes it real. Stub ids start with `stub-`.

const MAX_ANSWER_LENGTH = 1000

// Act calls these with a user id and a Kept day it worked out. A bad one is a
// bug on the calling side, so it fails here rather than returning Sara's data.
const callerInput = z.object({ userId: z.uuid(), keptDay: z.iso.date().optional() })

/** The user's goal answers so far, or null before the first. */
export async function getGoal(userId: string): Promise<GoalAnswers | null> {
	return db.goal.findUnique({
		where: { userId },
		select: { text: true, weeks: true, startingPoint: true, obstacle: true }
	})
}

export async function getPlanStatus(userId: string): Promise<PlanStatus> {
	const goal = await db.goal.findUnique({
		where: { userId },
		select: {
			text: true,
			weeks: true,
			startingPoint: true,
			obstacle: true,
			plan: { select: { confirmedAt: true } }
		}
	})
	return planStatusOf({ goal, plan: goal?.plan })
}

/**
 * The user's plan. TEMPORARY: a user with no plan yet gets Sara's, with stub
 * ids, until the plan step saves real ones (#30). Save a real plan for local
 * testing with savePlan (src/server/learn/save-plan.ts).
 */
export async function getPlan(userId: string): Promise<PlanForAct> {
	const plan = await db.plan.findUnique({
		where: { userId },
		select: {
			goal: { select: { text: true, weeks: true } },
			milestones: { orderBy: { position: 'asc' }, select: { id: true, week: true, text: true } },
			actions: {
				orderBy: { position: 'asc' },
				select: { id: true, position: true, small: true, medium: true, large: true }
			}
		}
	})
	if (plan == null || plan.goal.text == null || plan.goal.weeks == null) return saraPlanForAct()

	return {
		goal: { text: plan.goal.text, weeks: plan.goal.weeks },
		milestones: plan.milestones,
		actions: plan.actions.map(({ id, position, small, medium, large }) => ({
			id,
			position,
			sizes: { small, medium, large }
		}))
	}
}

/** The plan as the plan step shows it, before Confirm. Null without one: never Sara's. */
export async function getPlanDraft(userId: string) {
	const plan = await db.plan.findUnique({
		where: { userId },
		select: {
			attempts: true,
			goal: { select: { text: true, weeks: true } },
			milestones: { orderBy: { position: 'asc' }, select: { id: true, week: true, text: true } },
			actions: {
				orderBy: { position: 'asc' },
				select: { id: true, small: true, medium: true, large: true }
			},
			_count: { select: { keyIdeas: true } }
		}
	})
	if (plan == null) return null
	const { _count, ...draft } = plan
	return { ...draft, keyIdeaCount: _count.keyIdeas, canRebuild: plan.attempts === 1 }
}

function saraPlanForAct(): PlanForAct {
	return {
		goal: { text: SARA_GOAL.text, weeks: SARA_GOAL.weeks },
		milestones: SARA_GENERATED_PLAN.milestones.map((milestone, position) => ({
			id: `stub-milestone-${position}`,
			...milestone
		})),
		actions: SARA_GENERATED_PLAN.actions.map((sizes, position) => ({
			id: `stub-action-${position}`,
			position,
			sizes
		}))
	}
}

function saraFirstKeyIdea() {
	const idea = SARA_GENERATED_PLAN.keyIdeas[0]
	if (idea == null) throw new Error("Sara's plan has no key ideas")
	return { keyIdeaId: 'stub-key-idea-0', ...idea }
}

/**
 * Today's key idea from the user's confirmed plan: the one taught today, else
 * the next untaught, or null on a day with 2 recalls due. Only reads: teaching
 * it is teachLesson, when the person has seen it.
 */
export async function getTodaysLesson(userId: string, keptDay: KeptDay): Promise<Lesson | null> {
	callerInput.parse({ userId, keptDay })
	const day = keptDayDate(keptDay)
	const [plan, dueRecalls] = await Promise.all([
		db.plan.findUnique({
			where: { userId },
			select: {
				confirmedAt: true,
				keyIdeas: {
					select: { id: true, position: true, title: true, lesson: true, taughtOn: true }
				}
			}
		}),
		// At most 2 are ever shown, so counting past 2 is wasted work.
		db.review
			.findMany({
				where: { userId, dueOn: { lte: day }, recallAttemptId: null },
				select: { id: true },
				take: MAX_RECALLS_PER_DAY
			})
			.then((rows) => rows.length)
	])
	if (plan?.confirmedAt == null) return null

	const ideas = plan.keyIdeas.map((idea) => ({
		...idea,
		taughtOn: idea.taughtOn == null ? null : keptDayOf(idea.taughtOn)
	}))
	const id = todaysKeyIdea({ ideas, keptDay, dueRecalls })
	const idea = ideas.find((candidate) => candidate.id === id)
	return idea == null ? null : { keyIdeaId: idea.id, title: idea.title, lesson: idea.lesson }
}

/** TEMPORARY (#32): always Sara's first key idea coming back, as on her Day 2. */
export async function getDueReviews(userId: string, keptDay: KeptDay): Promise<DueReview[]> {
	callerInput.parse({ userId, keptDay })
	const { keyIdeaId, title, question, choices } = saraFirstKeyIdea()
	return [{ keyIdeaId, title, question, choices }]
}

/** TEMPORARY (#34): no milestone is due during the test week. */
export async function getDueMilestone(
	userId: string,
	keptDay: KeptDay
): Promise<DueMilestone | null> {
	callerInput.parse({ userId, keptDay })
	return null
}

/** TEMPORARY (#32): a fixed mark, 0 for an empty answer, else Sara's 1 out of 2. */
export async function gradeRecall(
	userId: string,
	keyIdeaId: string,
	answer: string
): Promise<RecallGrade> {
	callerInput.parse({ userId })
	z.string().min(1).parse(keyIdeaId)
	const { modelAnswer } = saraFirstKeyIdea()
	const trimmed = answer.trim().slice(0, MAX_ANSWER_LENGTH)
	if (trimmed === '') {
		return { score: 0, reason: 'No answer was given.', modelAnswer, isMultipleChoice: false }
	}
	return {
		score: 1,
		reason:
			'Partly. Easy runs also build the base that lets you run further, and they keep you from getting injured.',
		modelAnswer,
		isMultipleChoice: false
	}
}

/** TEMPORARY (#33): Sara's first idea, 1 out of 2 on day 2 then 2 out of 2 on day 4. */
export async function getRecallProgress(userId?: string): Promise<RecallProgress> {
	if (userId != null) callerInput.parse({ userId })
	const { keyIdeaId, title } = saraFirstKeyIdea()
	return {
		ideas: [
			{
				keyIdeaId,
				title,
				first: { score: 1, keptDay: '2026-11-01' },
				last: { score: 2, keptDay: '2026-11-03' }
			}
		],
		leftOut: 0
	}
}
