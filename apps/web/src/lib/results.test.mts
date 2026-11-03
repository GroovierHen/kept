import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { COUNTED_ACCOUNTS } from '../server/results/counted-accounts.ts'
import { buildRecallResults, buildResults, type ResultsEvent } from './results.ts'

const NOW = new Date('2026-11-05T12:00:00Z')
const TIME_ZONE = 'Europe/London'

let nextId = 0

function event(
	userId: string,
	name: ResultsEvent['name'],
	keptDay: string,
	details: unknown = {},
	occurredAt = `${keptDay}T12:00:00Z`
): ResultsEvent {
	nextId += 1
	return {
		id: `event-${String(nextId).padStart(4, '0')}`,
		userId,
		name,
		keptDay,
		occurredAt: new Date(occurredAt),
		details,
		timeZone: TIME_ZONE
	}
}

const report = (userId: string, keptDay: string, promiseId: string, answer: string) =>
	event(userId, 'report_made', keptDay, { promiseId, promiseDay: keptDay, answer })

const started = (userId: string, signUpDay: string) => [
	event(userId, 'signed_up', signUpDay),
	event(userId, 'setup_finished', signUpDay)
]

test('no events give zeros and no days, not an error', () => {
	assert.deepEqual(buildResults({ events: [], now: NOW }), {
		signedUp: 0,
		started: 0,
		days: [],
		kept: 0,
		partly: 0,
		slipped: 0,
		milestonesReached: 0
	})
})

test('signed up counts everyone, started only those who finished setup', () => {
	const results = buildResults({
		events: [...started('a', '2026-11-05'), event('b', 'signed_up', '2026-11-05')],
		now: NOW
	})
	assert.equal(results.signedUp, 2)
	assert.equal(results.started, 1)
})

test('a tester who stopped stays in the days they reached, as not checked in', () => {
	const results = buildResults({
		events: [
			...started('stayed', '2026-11-01'),
			...started('stopped', '2026-11-01'),
			report('stayed', '2026-11-02', 'p1', 'yes'),
			report('stopped', '2026-11-02', 'p2', 'yes'),
			report('stayed', '2026-11-03', 'p3', 'yes')
		],
		now: NOW
	})
	assert.deepEqual(results.days, [
		{ day: 2, checkedIn: 2, reached: 2 },
		{ day: 3, checkedIn: 1, reached: 2 },
		{ day: 4, checkedIn: 0, reached: 2 },
		{ day: 5, checkedIn: 0, reached: 2 }
	])
})

test('Day N is counted from each tester’s own sign-up day', () => {
	const results = buildResults({
		events: [
			...started('early', '2026-11-01'),
			...started('late', '2026-11-03'),
			report('early', '2026-11-04', 'p1', 'yes'),
			report('late', '2026-11-04', 'p2', 'yes')
		],
		now: NOW
	})
	assert.deepEqual(results.days, [
		{ day: 2, checkedIn: 1, reached: 2 },
		{ day: 3, checkedIn: 0, reached: 2 },
		{ day: 4, checkedIn: 1, reached: 1 },
		{ day: 5, checkedIn: 0, reached: 1 }
	])
})

test('a tester who only signed up hasn’t reached any day, and a time zone sets how far along one is', () => {
	const events = [
		event('browsing', 'signed_up', '2026-11-01'),
		{ ...event('a', 'signed_up', '2026-11-01'), timeZone: 'Asia/Tokyo' },
		event('a', 'setup_finished', '2026-11-01')
	]
	// 19:30 UTC is 04:30 on the 2nd in Tokyo, past the 4am rollover, and still the 1st in London.
	const results = buildResults({ events, now: new Date('2026-11-01T19:30:00Z') })
	assert.deepEqual(results.days, [{ day: 2, checkedIn: 0, reached: 1 }])
})

test('two Reports in a day are one tester checking in', () => {
	const results = buildResults({
		events: [
			...started('a', '2026-11-04'),
			report('a', '2026-11-05', 'p1', 'yes'),
			report('a', '2026-11-05', 'p1', 'no')
		],
		now: NOW
	})
	assert.deepEqual(results.days, [{ day: 2, checkedIn: 1, reached: 1 }])
})

test('Kept, Partly and Slipped count each Promise once, at its latest Report', () => {
	const results = buildResults({
		events: [
			...started('a', '2026-11-01'),
			report('a', '2026-11-02', 'kept', 'yes'),
			report('a', '2026-11-03', 'partly', 'partly'),
			report('a', '2026-11-04', 'slipped', 'no'),
			event(
				'a',
				'report_made',
				'2026-11-05',
				{ promiseId: 'changed', answer: 'no' },
				'2026-11-05T09:00:00Z'
			),
			event(
				'a',
				'report_made',
				'2026-11-05',
				{ promiseId: 'changed', answer: 'yes' },
				'2026-11-05T10:00:00Z'
			)
		],
		now: NOW
	})
	assert.deepEqual(
		{ kept: results.kept, partly: results.partly, slipped: results.slipped },
		{ kept: 2, partly: 1, slipped: 1 }
	)
})

test('the latest Report wins in any order, and an id settles the same instant', () => {
	const at = '2026-11-05T09:00:00Z'
	const newest = { id: 'z', answer: 'partly', occurredAt: at }
	const older = { id: 'y', answer: 'yes', occurredAt: '2026-11-05T08:00:00Z' }
	const sameInstant = { id: 'a', answer: 'no', occurredAt: at }
	const results = buildResults({
		events: [newest, older, sameInstant].map(({ id, answer, occurredAt }) => ({
			...event('a', 'report_made', '2026-11-05', { promiseId: 'p', answer }, occurredAt),
			id
		})),
		now: NOW
	})
	assert.deepEqual(
		{ kept: results.kept, partly: results.partly, slipped: results.slipped },
		{ kept: 0, partly: 1, slipped: 0 }
	)
})

test('an Unreported promise counts as neither', () => {
	const results = buildResults({
		events: [...started('a', '2026-11-01'), report('a', '2026-11-03', 'p2', 'yes')],
		now: NOW
	})
	assert.equal(results.kept + results.partly + results.slipped, 1)
})

test('milestones reached counts Yes, not Not yet', () => {
	const results = buildResults({
		events: [
			event('a', 'milestone_checked', '2026-11-05', { milestoneId: 'm1', answer: 'yes' }),
			event('a', 'milestone_checked', '2026-11-05', { milestoneId: 'm2', answer: 'not_yet' })
		],
		now: NOW
	})
	assert.equal(results.milestonesReached, 1)
})

const idea = (keyIdeaId: string, first: number, last: number) => ({
	keyIdeaId,
	title: 'Run slow enough to talk',
	first: { score: first, keptDay: '2026-11-02' },
	last: { score: last, keptDay: '2026-11-04' }
})

test('recall results give first against last and the number left out, without titles or ids', () => {
	const results = buildRecallResults({ ideas: [idea('real-id', 1, 2)], leftOut: 3 })
	assert.deepEqual(results, { ideas: [{ first: 1, last: 2 }], leftOut: 3 })
})

test('Learn’s stub of Sara’s scores never reads as testers’ scores', () => {
	const results = buildRecallResults({ ideas: [idea('stub-key-idea-0', 1, 2)], leftOut: 0 })
	assert.deepEqual(results, { ideas: [], leftOut: 0 })
})

test('accounts counted in results leave out the demo account and our own', () => {
	assert.deepEqual(COUNTED_ACCOUNTS, { isCountedInResults: true, isDemo: false })
})

test('the page’s copy never mentions reminders', () => {
	const { ResultsPage } = JSON.parse(readFileSync('messages/en.json', 'utf8'))
	assert.doesNotMatch(JSON.stringify(ResultsPage), /reminder/i)
})
