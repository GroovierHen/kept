import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays } from './kept-day.ts'
import { buildStreak } from './streak.ts'

const SIGN_UP_DAY = '2026-11-01'

// The Kept day of Day N, with Day 1 the sign-up day.
const day = (n: number) => addDays({ day: SIGN_UP_DAY, days: n - 1 })

// The Streak on Day `today`, with a Check-in finished on each of `checkedIn`.
const streakOn = ({ today, checkedIn }: { today: number; checkedIn: readonly number[] }) =>
	buildStreak({ checkInDays: checkedIn.map(day), today: day(today) })

test('a Check-in on every Kept day counts every day', () => {
	const streak = streakOn({ today: 4, checkedIn: [1, 2, 3, 4] })
	assert.equal(streak.days, 4)
	assert.equal(streak.best, 4)
})

test('one Empty day is forgiven: the Streak holds without growing', () => {
	const streak = streakOn({ today: 5, checkedIn: [1, 2, 3, 5] })
	assert.equal(streak.days, 4)
	assert.equal(streak.isForgivenessReady, false)
})

test("today isn't an Empty day before its Check-in is finished", () => {
	const streak = streakOn({ today: 4, checkedIn: [1, 2, 3] })
	assert.equal(streak.days, 3)
	assert.equal(streak.isForgivenessReady, true)
})

test('a second Empty day before forgiveness comes back ends the Streak, and Best streak keeps it', () => {
	// Sara: 3 Check-ins, Day 4 forgiven, Day 5 kept, Day 6 empty, back on Day 7.
	const streak = streakOn({ today: 7, checkedIn: [1, 2, 3, 5, 7] })
	assert.equal(streak.days, 1)
	assert.equal(streak.best, 4)
})

test('forgiveness comes back after 3 Check-ins in a row, so a later Empty day is forgiven too', () => {
	// Day 3 forgiven, Days 4 to 6 in a row, Day 7 forgiven again.
	const streak = streakOn({ today: 8, checkedIn: [1, 2, 4, 5, 6, 8] })
	assert.equal(streak.days, 6)
	assert.equal(streak.isForgivenessReady, false)
})

test('a Comeback is counted after any Empty day, forgiven or not', () => {
	// Back on Day 5 after a forgiven Day 4, and on Day 9 after Days 7 and 8 ended it.
	const streak = streakOn({ today: 10, checkedIn: [1, 2, 3, 5, 6, 9, 10] })
	assert.equal(streak.comebacks, 2)
})

test("today's Comeback says whether the Streak was safe or started again", () => {
	assert.equal(streakOn({ today: 5, checkedIn: [1, 2, 3, 5] }).comebackToday, 'safe')
	assert.equal(streakOn({ today: 7, checkedIn: [1, 2, 3, 5, 7] }).comebackToday, 'restarted')
	assert.equal(streakOn({ today: 4, checkedIn: [1, 2, 3, 4] }).comebackToday, null)
	// Not a Comeback until today's Check-in is finished.
	assert.equal(streakOn({ today: 5, checkedIn: [1, 2, 3] }).comebackToday, null)
})
