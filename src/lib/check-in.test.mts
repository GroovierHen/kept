import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkInStep, type LatestPromise } from './check-in.ts'

const TODAY = '2026-11-02'
const YESTERDAY = '2026-11-01'

// Day 2: the Promise made at setup is due, and nothing has happened yet.
const dueToday: LatestPromise = {
	promiseDay: TODAY,
	committedOn: YESTERDAY,
	hasReport: false
}

test('the first thing on a due day is the Report', () => {
	assert.equal(checkInStep({ today: TODAY, latestPromise: dueToday, hasLearned: false }), 'report')
})

test('after the Report comes the learn card', () => {
	const latestPromise = { ...dueToday, hasReport: true }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: false }), 'learn')
})

test('after the learn card comes the next Promise', () => {
	const latestPromise = { ...dueToday, hasReport: true }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: true }), 'commit')
})

test('committing the next Promise finishes the check-in', () => {
	const latestPromise = { promiseDay: '2026-11-03', committedOn: TODAY, hasReport: false }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: true }), 'done')
})

test('setup counts as Day 1’s check-in, so Day 1 is already done', () => {
	const latestPromise = { promiseDay: '2026-11-03', committedOn: TODAY, hasReport: false }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: false }), 'done')
})

test('the same Promise is judged by the Kept day it is given', () => {
	const latestPromise = { promiseDay: TODAY, committedOn: YESTERDAY, hasReport: false }
	assert.equal(checkInStep({ today: YESTERDAY, latestPromise, hasLearned: false }), 'done')
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: false }), 'report')
	assert.equal(checkInStep({ today: '2026-11-03', latestPromise, hasLearned: false }), 'report')
	assert.equal(checkInStep({ today: '2026-11-04', latestPromise, hasLearned: false }), 'learn')
})

test('a Promise committed today for today waits for tomorrow’s Report', () => {
	const latestPromise = { promiseDay: TODAY, committedOn: TODAY, hasReport: false }
	assert.equal(checkInStep({ today: TODAY, latestPromise, hasLearned: true }), 'done')
})

test('a user with no Promise goes to the commit step, not a dead end', () => {
	assert.equal(checkInStep({ today: TODAY, latestPromise: null, hasLearned: true }), 'commit')
})
