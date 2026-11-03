import 'server-only'
import { z } from 'zod'
import type { KeptDay } from '@/lib/kept-day'
import { SARA_GENERATED_PLAN, SARA_GOAL } from '@/lib/learn/sara-plan'
import { SARA_RECALLS } from '@/lib/learn/sara-week'
import { db } from '@/server/db/client'
import { recordRecall } from './grade-recall'
import { getTodaysLesson } from './learn'
import { savePlan } from './save-plan'
import { teachLesson } from './teach-lesson'

// What Learn gives the demo replay (#25, #35): Sara's plan, saved rather than
// asked of the AI, and her learning for each day of the week, played through
// the same code a real user's taps go through. The replay passes the Kept day,
// so nothing fakes the clock. Every step is safe to run again: a second run
// finds the plan, the answers and the lessons already saved.

// The model column says where the plan came from; Sara's was never generated.
const SAVED_PLAN = 'sara-demo'

const replayInput = z.object({
	userId: z.uuid(),
	day: z.int().min(1),
	keptDay: z.iso.date()
})

/** Saves Sara's plan for the demo user, confirmed, as if she'd made it on Day 1. */
export function saveSaraPlan(userId: string): Promise<{ planId: string }> {
	z.uuid().parse(userId)
	return savePlan({
		userId,
		goal: {
			text: SARA_GOAL.text,
			weeks: SARA_GOAL.weeks,
			startingPoint: SARA_GOAL.startingPoint,
			obstacle: SARA_GOAL.obstacle
		},
		plan: SARA_GENERATED_PLAN,
		model: SAVED_PLAN,
		isConfirmed: true
	})
}

/**
 * Sara's learning on one day of her week: answers the ideas that come back
 * with her saved answers and marks, then learns the day's new idea if there is
 * one. Call it after her report and before her next promise, like the Today
 * screen. Day 1 only teaches, as setup does.
 */
export async function playSaraLearnDay(input: {
	userId: string
	day: number
	keptDay: KeptDay
}): Promise<void> {
	const { userId, day, keptDay } = replayInput.parse(input)
	const ideas = await db.keyIdea.findMany({
		where: { plan: { userId } },
		orderBy: { position: 'asc' },
		select: { id: true }
	})

	for (const recall of SARA_RECALLS.filter((saved) => saved.day === day)) {
		const idea = ideas[recall.idea]
		if (idea == null) throw new Error(`Sara's plan has no key idea ${recall.idea}`)
		const outcome = await recordRecall({
			userId,
			keyIdeaId: idea.id,
			keptDay,
			answer: recall.answer,
			score: recall.score,
			reason: recall.reason
		})
		// Not due means the replay and the scheduler disagree about her week.
		if (outcome.kind === 'not_due') {
			throw new Error(`Day ${day}: key idea ${recall.idea} isn't due, so the replay is off`)
		}
	}

	const lesson = await getTodaysLesson(userId, keptDay)
	if (lesson != null) await teachLesson({ userId, keyIdeaId: lesson.keyIdeaId, keptDay })
}
