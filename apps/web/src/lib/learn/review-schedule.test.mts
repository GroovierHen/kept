import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nextReturn, recallsLeftToday } from './review-schedule.ts'

// Learned on Day 1, which is 2026-10-31.
const taughtOn = '2026-10-31'

test('an idea first comes back the day after it is learned', () => {
	assert.equal(nextReturn({ taughtOn, recalls: [] }), '2026-11-01')
})

test('answered on time, it comes back 1, 3 and 7 days after it was learned, then stops', () => {
	const day2 = { keptDay: '2026-11-01', score: 2 } as const
	const day4 = { keptDay: '2026-11-03', score: 1 } as const
	const day8 = { keptDay: '2026-11-07', score: 2 } as const
	assert.equal(nextReturn({ taughtOn, recalls: [day2] }), '2026-11-03')
	assert.equal(nextReturn({ taughtOn, recalls: [day2, day4] }), '2026-11-07')
	assert.equal(nextReturn({ taughtOn, recalls: [day2, day4, day8] }), null)
})

test('a 1 out of 2 keeps it on schedule, the same as a 2', () => {
	const partly = nextReturn({ taughtOn, recalls: [{ keptDay: '2026-11-01', score: 1 }] })
	const right = nextReturn({ taughtOn, recalls: [{ keptDay: '2026-11-01', score: 2 }] })
	assert.equal(partly, right)
})

test('a 0 out of 2 starts it over, 1 day after that recall', () => {
	const recalls = [
		{ keptDay: '2026-11-01', score: 2 },
		{ keptDay: '2026-11-03', score: 0 }
	] as const
	assert.equal(nextReturn({ taughtOn, recalls }), '2026-11-04')
	// Started over, so it needs all three returns again.
	const after = [...recalls, { keptDay: '2026-11-04', score: 1 } as const]
	assert.equal(nextReturn({ taughtOn, recalls: after }), '2026-11-06')
})

test('a 0 on the last return starts it over rather than ending it', () => {
	const recalls = [
		{ keptDay: '2026-11-01', score: 2 },
		{ keptDay: '2026-11-03', score: 2 },
		{ keptDay: '2026-11-07', score: 0 }
	] as const
	assert.equal(nextReturn({ taughtOn, recalls }), '2026-11-08')
})

test('an idea that waits counts its next return from the day it was actually answered', () => {
	// Due on Day 2, answered on Day 4.
	const recalls = [{ keptDay: '2026-11-03', score: 1 }] as const
	assert.equal(nextReturn({ taughtOn, recalls }), '2026-11-05')
})

test('recalls are read in day order, whatever order they arrive in', () => {
	const recalls = [
		{ keptDay: '2026-11-03', score: 1 },
		{ keptDay: '2026-11-01', score: 0 }
	] as const
	assert.equal(nextReturn({ taughtOn, recalls }), '2026-11-05')
})

test('a check-in asks at most 2 recalls, counting those already answered today', () => {
	assert.equal(recallsLeftToday({ answeredToday: 0, waiting: 5 }), 2)
	assert.equal(recallsLeftToday({ answeredToday: 1, waiting: 5 }), 1)
	assert.equal(recallsLeftToday({ answeredToday: 2, waiting: 5 }), 0)
	assert.equal(recallsLeftToday({ answeredToday: 0, waiting: 1 }), 1)
	assert.equal(recallsLeftToday({ answeredToday: 0, waiting: 0 }), 0)
})
