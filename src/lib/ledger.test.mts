import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays } from './kept-day.ts'
import { buildLedger, nextMilestone, ownRecallProgress, type LedgerEvent } from './ledger.ts'

const SIGN_UP_DAY = '2026-11-01'
const RUN = 'action-run'

// The Kept day of Day N, with Day 1 the sign-up day.
const day = (n: number) => addDays({ day: SIGN_UP_DAY, days: n - 1 })

function committed({
	on,
	actionId = RUN,
	size = 'small'
}: {
	on: number
	actionId?: string | null
	size?: 'small' | 'medium' | 'large' | null
}): LedgerEvent {
	return {
		name: 'promise_committed',
		details: { promiseId: `promise-${on}`, promiseDay: day(on), actionId, size }
	}
}

function changed({
	on,
	actionId = RUN,
	size = 'small'
}: {
	on: number
	actionId?: string | null
	size?: 'small' | 'medium' | 'large' | null
}): LedgerEvent {
	return {
		name: 'promise_changed',
		details: { promiseId: `promise-${on}`, promiseDay: day(on), actionId, size }
	}
}

function reported({ on, answer }: { on: number; answer: 'yes' | 'partly' | 'no' }): LedgerEvent {
	return {
		name: 'report_made',
		details: { promiseId: `promise-${on}`, promiseDay: day(on), answer }
	}
}

// docs/product/walkthrough.md: Yes on days 2, 3 and 4, then Partly on day 5. The third
// Yes moves the Promise for day 5 up a size, and she has committed day 6 by the time
// she checks her ledger.
const SARA_DAY_5: LedgerEvent[] = [
	committed({ on: 2 }),
	reported({ on: 2, answer: 'yes' }),
	committed({ on: 3 }),
	reported({ on: 3, answer: 'yes' }),
	committed({ on: 4 }),
	reported({ on: 4, answer: 'yes' }),
	committed({ on: 5, size: 'medium' }),
	reported({ on: 5, answer: 'partly' }),
	committed({ on: 6, size: 'medium' })
]

test("Sara's day 5: Kept 3, Partly 1, Slipped 0, and 3.5 of 4", () => {
	const ledger = buildLedger({ events: SARA_DAY_5, today: day(5) })
	assert.deepEqual(ledger.kept, [day(2), day(3), day(4)])
	assert.deepEqual(ledger.partly, [day(5)])
	assert.deepEqual(ledger.slipped, [])
	assert.deepEqual(ledger.week, { kept: 3.5, total: 4 })
})

test("Sara's day 5: Run moved from small to medium on day 5", () => {
	const { sizeChanges } = buildLedger({ events: SARA_DAY_5, today: day(5) })
	assert.deepEqual(sizeChanges, [
		{ actionId: RUN, from: 'small', to: 'medium', direction: 'bigger', promiseDay: day(5) }
	])
})

test('no Events gives an empty ledger, without error', () => {
	assert.deepEqual(buildLedger({ events: [], today: day(1) }), {
		kept: [],
		partly: [],
		slipped: [],
		sizeChanges: [],
		week: { kept: 0, total: 0 }
	})
})

test('the latest Report for a Promise is the one that counts', () => {
	const ledger = buildLedger({
		events: [
			committed({ on: 2 }),
			reported({ on: 2, answer: 'no' }),
			reported({ on: 2, answer: 'yes' })
		],
		today: day(2)
	})
	assert.deepEqual(ledger.kept, [day(2)])
	assert.deepEqual(ledger.slipped, [])
	assert.deepEqual(ledger.week, { kept: 1, total: 1 })
})

test('a Slipped promise lowers the Week and a Partly counts as half', () => {
	const { week, slipped } = buildLedger({
		events: [
			committed({ on: 2 }),
			reported({ on: 2, answer: 'no' }),
			committed({ on: 3 }),
			reported({ on: 3, answer: 'partly' })
		],
		today: day(3)
	})
	assert.deepEqual(slipped, [day(2)])
	assert.deepEqual(week, { kept: 0.5, total: 2 })
})

test('a Typed promise counts like any other', () => {
	const ledger = buildLedger({
		events: [committed({ on: 2, actionId: null, size: null }), reported({ on: 2, answer: 'yes' })],
		today: day(2)
	})
	assert.deepEqual(ledger.kept, [day(2)])
	assert.deepEqual(ledger.week, { kept: 1, total: 1 })
})

test('an Unreported promise is neither kept nor slipped, and is left out of the Week', () => {
	const ledger = buildLedger({
		events: [
			committed({ on: 2 }),
			reported({ on: 2, answer: 'yes' }),
			committed({ on: 3 }),
			committed({ on: 6 }),
			reported({ on: 6, answer: 'no' })
		],
		today: day(6)
	})
	assert.deepEqual(ledger.kept, [day(2)])
	assert.deepEqual(ledger.slipped, [day(6)])
	assert.deepEqual(ledger.week, { kept: 1, total: 2 })
})

test('a Promise waiting for its Report counts for nothing yet', () => {
	const { week, kept } = buildLedger({ events: [committed({ on: 2 })], today: day(2) })
	assert.deepEqual(kept, [])
	assert.deepEqual(week, { kept: 0, total: 0 })
})

test('a Week is the last 7 Kept days, today included, while the counts cover every day', () => {
	const events = [8, 9, 15].flatMap((on) => [committed({ on }), reported({ on, answer: 'yes' })])

	const onDay15 = buildLedger({ events, today: day(15) })
	assert.deepEqual(onDay15.week, { kept: 2, total: 2 })
	assert.deepEqual(onDay15.kept, [day(8), day(9), day(15)])

	assert.deepEqual(buildLedger({ events, today: day(16) }).week, { kept: 1, total: 1 })
})

test('with every Promise at one Size, no Action has changed', () => {
	const events = [2, 3, 4].map((on) => committed({ on }))
	assert.deepEqual(buildLedger({ events, today: day(4) }).sizeChanges, [])
})

test('a smaller Size is a change too', () => {
	const { sizeChanges } = buildLedger({
		events: [committed({ on: 2, size: 'medium' }), committed({ on: 3, size: 'small' })],
		today: day(3)
	})
	assert.deepEqual(sizeChanges, [
		{ actionId: RUN, from: 'medium', to: 'small', direction: 'smaller', promiseDay: day(3) }
	])
})

test('each Action shows its latest change, newest first', () => {
	const { sizeChanges } = buildLedger({
		events: [
			committed({ on: 2, actionId: 'action-stretch' }),
			committed({ on: 3, actionId: 'action-stretch', size: 'medium' }),
			committed({ on: 4 }),
			committed({ on: 5, size: 'medium' }),
			committed({ on: 6, size: 'large' })
		],
		today: day(6)
	})
	assert.deepEqual(
		sizeChanges.map(({ actionId, from, to }) => [actionId, from, to]),
		[
			[RUN, 'medium', 'large'],
			['action-stretch', 'small', 'medium']
		]
	)
})

test('going back to an Action compares with its own last Size', () => {
	const { sizeChanges } = buildLedger({
		events: [
			committed({ on: 2, size: 'medium' }),
			committed({ on: 3, actionId: 'action-stretch' }),
			committed({ on: 4, actionId: null, size: null }),
			committed({ on: 5, size: 'medium' })
		],
		today: day(5)
	})
	assert.deepEqual(sizeChanges, [])
})

test('a change moving a Promise to another Action leaves the first Action’s Size alone', () => {
	const { sizeChanges } = buildLedger({
		events: [
			committed({ on: 2 }),
			committed({ on: 3, size: 'medium' }),
			changed({ on: 3, actionId: 'action-stretch' })
		],
		today: day(3)
	})
	assert.deepEqual(sizeChanges, [])
})

test('a change to another Size is the Size that counts', () => {
	const events = [committed({ on: 2 }), committed({ on: 3 }), changed({ on: 3, size: 'medium' })]
	assert.deepEqual(buildLedger({ events, today: day(3) }).sizeChanges, [
		{ actionId: RUN, from: 'small', to: 'medium', direction: 'bigger', promiseDay: day(3) }
	])
})

test('a change back to the committed Size is no change at all', () => {
	const { sizeChanges } = buildLedger({
		events: [
			committed({ on: 2 }),
			committed({ on: 3, size: 'medium' }),
			changed({ on: 3, size: 'small' })
		],
		today: day(3)
	})
	assert.deepEqual(sizeChanges, [])
})

test('a change to a Typed promise leaves it with no Size to compare', () => {
	const { sizeChanges } = buildLedger({
		events: [
			committed({ on: 2 }),
			committed({ on: 3, size: 'medium' }),
			changed({ on: 3, actionId: null, size: null })
		],
		today: day(3)
	})
	assert.deepEqual(sizeChanges, [])
})

test('a changed Promise still counts once', () => {
	const ledger = buildLedger({
		events: [
			committed({ on: 2 }),
			changed({ on: 2, actionId: 'action-stretch' }),
			changed({ on: 2, size: 'medium' }),
			reported({ on: 2, answer: 'yes' })
		],
		today: day(2)
	})
	assert.deepEqual(ledger.kept, [day(2)])
	assert.deepEqual(ledger.week, { kept: 1, total: 1 })
})

const MILESTONES = [
	{ id: 'week-5', week: 5, text: 'Run 3.5 km' },
	{ id: 'week-2', week: 2, text: 'Run 2 km' },
	{ id: 'week-8', week: 8, text: 'Run 5 km' }
]

test('on day 5 the next Milestone is week 2, due in 9 days', () => {
	assert.deepEqual(
		nextMilestone({ milestones: MILESTONES, signUpDay: SIGN_UP_DAY, today: day(5) }),
		{
			id: 'week-2',
			week: 2,
			text: 'Run 2 km',
			daysLeft: 9
		}
	)
})

test('a Milestone stays next on its own day, then the following one takes over', () => {
	const next = (on: number) =>
		nextMilestone({ milestones: MILESTONES, signUpDay: SIGN_UP_DAY, today: day(on) })
	assert.equal(next(14)?.id, 'week-2')
	assert.equal(next(14)?.daysLeft, 0)
	assert.equal(next(15)?.id, 'week-5')
	assert.equal(next(15)?.daysLeft, 20)
})

test('there is no next Milestone once the last has passed', () => {
	assert.equal(
		nextMilestone({ milestones: MILESTONES, signUpDay: SIGN_UP_DAY, today: day(57) }),
		null
	)
})

const recalled = (keyIdeaId: string) => ({
	keyIdeaId,
	title: 'Run slow enough to talk',
	first: { score: 1, keptDay: day(2) },
	last: { score: 2, keptDay: day(4) }
})

test('Learn’s stub of Sara’s scores never reads as the user’s own', () => {
	assert.deepEqual(ownRecallProgress({ ideas: [recalled('stub-key-idea-0')], leftOut: 0 }), {
		ideas: [],
		leftOut: 0
	})
})

test('real recall progress passes through untouched', () => {
	const progress = { ideas: [recalled('0190a1b2-real-id')], leftOut: 2 }
	assert.deepEqual(ownRecallProgress(progress), progress)
})
