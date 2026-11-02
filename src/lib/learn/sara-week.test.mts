import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays } from '../kept-day.ts'
import { todaysKeyIdea } from './lesson.ts'
import { nextReturn, recallsLeftToday, type PastRecall } from './review-schedule.ts'
import { SARA_GENERATED_PLAN } from './sara-plan.ts'
import { SARA_RECALLS } from './sara-week.ts'

// Plays Sara's week through the scheduler's own rules, day by day, and checks
// that the ideas it asks about are exactly the ones SARA_RECALLS answers.
const DAY_1 = '2026-10-31'
const dayOf = (day: number) => addDays({ day: DAY_1, days: day - 1 })

function playWeek(lastDay: number) {
	const ideas: { id: string; position: number; taughtOn: string | null; recalls: PastRecall[] }[] =
		SARA_GENERATED_PLAN.keyIdeas.map((_, position) => ({
			id: String(position),
			position,
			taughtOn: null,
			recalls: []
		}))
	const taught: number[] = []
	const asked: { day: number; idea: number }[] = []

	for (let day = 1; day <= lastDay; day += 1) {
		const keptDay = dayOf(day)
		const due = ideas
			.filter((idea) => {
				if (idea.taughtOn == null) return false
				const back = nextReturn({ taughtOn: idea.taughtOn, recalls: idea.recalls })
				return back != null && back <= keptDay
			})
			.sort((a, b) => (a.taughtOn ?? '').localeCompare(b.taughtOn ?? '') || a.position - b.position)
			.slice(0, recallsLeftToday({ answeredToday: 0, waiting: Number.MAX_SAFE_INTEGER }))

		for (const idea of due) {
			asked.push({ day, idea: idea.position })
			const answer = SARA_RECALLS.find((r) => r.day === day && r.idea === idea.position)
			assert.ok(
				answer,
				`day ${day}: the scheduler asks about idea ${idea.position}, with no answer`
			)
			idea.recalls.push({ keptDay, score: answer.score })
		}

		const lesson = todaysKeyIdea({ ideas, keptDay, dueRecalls: due.length })
		const idea = ideas.find((candidate) => candidate.id === lesson)
		if (idea != null) {
			idea.taughtOn = keptDay
			taught.push(idea.position)
		}
	}
	return { ideas, taught, asked }
}

test('every answer is for an idea the scheduler asks about that day, and none is missing', () => {
	const { asked } = playWeek(5)
	const answered = SARA_RECALLS.map(({ day, idea }) => ({ day, idea }))
	assert.deepEqual(asked, answered)
})

test('she learns ideas 0, 1, 2 and 3 on days 1, 2, 3 and 5, and none on day 4', () => {
	assert.deepEqual(playWeek(5).taught, [0, 1, 2, 3])
	assert.deepEqual(playWeek(4).taught, [0, 1, 2])
})

test('run slow enough to talk scores 1 on day 2 and 2 on day 4, then comes back on day 8', () => {
	const runSlow = playWeek(5).ideas[0]
	assert.deepEqual(runSlow?.recalls, [
		{ keptDay: dayOf(2), score: 1 },
		{ keptDay: dayOf(4), score: 2 }
	])
	assert.equal(nextReturn({ taughtOn: dayOf(1), recalls: runSlow?.recalls ?? [] }), dayOf(8))
})

test('every answer is something a person would type, and every mark has a reason', () => {
	for (const recall of SARA_RECALLS) {
		assert.ok(recall.answer.trim().length > 0 && recall.answer.length <= 1000)
		assert.ok(recall.reason.trim().length > 0 && recall.reason.length <= 300)
		assert.ok(recall.idea < SARA_GENERATED_PLAN.keyIdeas.length)
	}
})
