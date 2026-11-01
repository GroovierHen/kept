import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	canChangePromise,
	canReport,
	checkInStep,
	closedAsUnreported,
	type LatestPromise
} from './check-in.ts'
import { addDays, isReviewDue, nextPromiseDay, toKeptDay } from './kept-day.ts'

const TODAY = '2026-11-02'
const YESTERDAY = '2026-11-01'

// Day 2: the Promise made at setup is due, and nothing has happened yet.
const dueToday: LatestPromise = {
	promiseDay: TODAY,
	committedOn: YESTERDAY,
	reportedOn: null
}

test('the first thing on a due day is the Report', () => {
	assert.equal(checkInStep({ today: TODAY, latestPromise: dueToday, hasLearned: false }), 'report')
})

test('after the Report comes the learn card', () => {
	const latestPromise = { ...dueToday, reportedOn: TODAY }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: false }), 'learn')
})

test('after the learn card comes the next Promise', () => {
	const latestPromise = { ...dueToday, reportedOn: TODAY }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: true }), 'commit')
})

test('committing the next Promise finishes the check-in', () => {
	const latestPromise = { promiseDay: '2026-11-03', committedOn: TODAY, reportedOn: null }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: true }), 'done')
})

test('setup counts as Day 1’s check-in, so Day 1 is already done', () => {
	const latestPromise = { promiseDay: '2026-11-03', committedOn: TODAY, reportedOn: null }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: false }), 'done')
})

test('the same Promise is judged by the Kept day it is given', () => {
	const latestPromise = { promiseDay: TODAY, committedOn: YESTERDAY, reportedOn: null }
	assert.equal(checkInStep({ today: YESTERDAY, latestPromise, hasLearned: false }), 'done')
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: false }), 'report')
	assert.equal(checkInStep({ today: '2026-11-03', latestPromise, hasLearned: false }), 'report')
	assert.equal(checkInStep({ today: '2026-11-04', latestPromise, hasLearned: false }), 'learn')
})

test('a Promise committed today for today waits for tomorrow’s Report', () => {
	const latestPromise = { promiseDay: TODAY, committedOn: TODAY, reportedOn: null }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: true }), 'done')
})

test('a user with no Promise goes to the commit step, not a dead end', () => {
	assert.equal(checkInStep({ today: TODAY, latestPromise: null, hasLearned: true }), 'commit')
})

// 4am in Karachi (UTC+5) is 23:00 UTC the evening before.
const TIME_ZONE = 'Asia/Karachi'
const keptDayAt = (iso: string) => toKeptDay({ instant: new Date(iso), timeZone: TIME_ZONE })
const NOV_2_LAST_MINUTE = '2026-11-02T22:59:00Z'
const NOV_3_FIRST_MINUTE = '2026-11-02T23:00:00Z'
const NOV_3_LAST_MINUTE = '2026-11-03T22:59:00Z'
const NOV_4_FIRST_MINUTE = '2026-11-03T23:00:00Z'

test('the 4am instants below fall on the Kept days they are named for', () => {
	assert.equal(keptDayAt(NOV_2_LAST_MINUTE), TODAY)
	assert.equal(keptDayAt(NOV_3_FIRST_MINUTE), '2026-11-03')
	assert.equal(keptDayAt(NOV_3_LAST_MINUTE), '2026-11-03')
	assert.equal(keptDayAt(NOV_4_FIRST_MINUTE), '2026-11-04')
})

test('a Promise stays open for a late Report until 4am on the second day after it', () => {
	const today = keptDayAt(NOV_3_LAST_MINUTE)
	assert.equal(checkInStep({ today, latestPromise: dueToday, hasLearned: false }), 'report')
	assert.equal(canReport({ promiseDay: TODAY, reportedOn: null, today }), true)
	assert.equal(closedAsUnreported({ today, latestPromise: dueToday }), false)
})

test('a Promise closes as Unreported at that 4am, with a note, and the Report is skipped', () => {
	const today = keptDayAt(NOV_4_FIRST_MINUTE)
	assert.equal(checkInStep({ today, latestPromise: dueToday, hasLearned: false }), 'learn')
	assert.equal(checkInStep({ today, latestPromise: dueToday, hasLearned: true }), 'commit')
	assert.equal(canReport({ promiseDay: TODAY, reportedOn: null, today }), false)
	assert.equal(closedAsUnreported({ today, latestPromise: dueToday }), true)
})

test('the Unreported note is for a closed Promise nobody reported, and goes with the next one', () => {
	const today = '2026-11-10'
	const reported = { ...dueToday, reportedOn: TODAY }
	assert.equal(closedAsUnreported({ today, latestPromise: reported }), false)
	assert.equal(closedAsUnreported({ today, latestPromise: null }), false)
	assert.equal(closedAsUnreported({ today: TODAY, latestPromise: dueToday }), false)

	const next = { promiseDay: today, committedOn: today, reportedOn: null }
	assert.equal(closedAsUnreported({ today, latestPromise: next }), false)
	assert.equal(checkInStep({ today, latestPromise: next, hasLearned: true }), 'done')
})

test('a return after a gap commits a Promise for that same day', () => {
	const today = '2026-11-10'
	assert.equal(nextPromiseDay({ today, latestPromiseDay: dueToday.promiseDay }), today)
})

test('a Report can be changed until 4am of the Kept day it was made on', () => {
	const reportedOn = keptDayAt(NOV_2_LAST_MINUTE)
	const promise = { promiseDay: TODAY, reportedOn }
	assert.equal(canReport({ ...promise, today: keptDayAt(NOV_2_LAST_MINUTE) }), true)
	assert.equal(canReport({ ...promise, today: keptDayAt(NOV_3_FIRST_MINUTE) }), false)
})

test('a late Report can be changed until 4am of the day it was made, not of the Promise’s day', () => {
	const reportedOn = keptDayAt(NOV_3_FIRST_MINUTE)
	const promise = { promiseDay: TODAY, reportedOn }
	assert.equal(canReport({ ...promise, today: keptDayAt(NOV_3_LAST_MINUTE) }), true)
	assert.equal(canReport({ ...promise, today: keptDayAt(NOV_4_FIRST_MINUTE) }), false)
})

test('a changed Report leaves the step, and so the committed Promise, as it is', () => {
	const committed = {
		promiseDay: addDays({ day: TODAY, days: 1 }),
		committedOn: TODAY,
		reportedOn: null
	}
	assert.equal(checkInStep({ today: TODAY, latestPromise: committed, hasLearned: true }), 'done')
	assert.equal(canChangePromise({ ...committed, today: TODAY }), true)
})

test('a committed Promise can be changed until 4am of the Kept day it was made on', () => {
	const committedOn = keptDayAt(NOV_2_LAST_MINUTE)
	const promise = { committedOn, reportedOn: null }
	assert.equal(canChangePromise({ ...promise, today: keptDayAt(NOV_2_LAST_MINUTE) }), true)
	assert.equal(canChangePromise({ ...promise, today: keptDayAt(NOV_3_FIRST_MINUTE) }), false)
})

test('a Promise with a Report on it can’t be changed', () => {
	assert.equal(canChangePromise({ committedOn: TODAY, reportedOn: TODAY, today: TODAY }), false)
})

test('a user who reported and left starts at commit the next day, with a Promise for that day', () => {
	const today = keptDayAt(NOV_3_FIRST_MINUTE)
	const latestPromise = { ...dueToday, reportedOn: keptDayAt(NOV_2_LAST_MINUTE) }
	assert.equal(checkInStep({ today, latestPromise, hasLearned: false }), 'commit')
	assert.equal(nextPromiseDay({ today, latestPromiseDay: latestPromise.promiseDay }), today)
})

test('a user who reported and comes back before 4am carries on where they were', () => {
	const today = keptDayAt(NOV_2_LAST_MINUTE)
	const latestPromise = { ...dueToday, reportedOn: today }
	assert.equal(checkInStep({ today, latestPromise, hasLearned: false }), 'learn')
	assert.equal(nextPromiseDay({ today, latestPromiseDay: latestPromise.promiseDay }), '2026-11-03')
})

test('a user who reported and stayed away for days still starts at commit, with no note', () => {
	const today = '2026-11-10'
	const latestPromise = { ...dueToday, reportedOn: TODAY }
	assert.equal(checkInStep({ today, latestPromise, hasLearned: false }), 'commit')
	assert.equal(closedAsUnreported({ today, latestPromise }), false)
	assert.equal(nextPromiseDay({ today, latestPromiseDay: latestPromise.promiseDay }), today)
})

test('a Recall skipped by a gap stays due until it is answered', () => {
	const dueOn = TODAY
	assert.equal(isReviewDue({ dueOn, isAnswered: false, today: YESTERDAY }), false)
	assert.equal(isReviewDue({ dueOn, isAnswered: false, today: TODAY }), true)
	assert.equal(isReviewDue({ dueOn, isAnswered: false, today: '2026-11-10' }), true)
	assert.equal(isReviewDue({ dueOn, isAnswered: true, today: '2026-11-10' }), false)
})

test('a return after a gap reaches the learn step, where a due Recall is asked', () => {
	assert.equal(
		checkInStep({ today: '2026-11-10', latestPromise: dueToday, hasLearned: false }),
		'learn'
	)
})
