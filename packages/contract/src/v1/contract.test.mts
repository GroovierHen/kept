import { test } from 'node:test'
import assert from 'node:assert/strict'
import { endpoints, errorBodySchema, todayResponse } from '../../index.ts'

test('every endpoint path is unique and under /api/app/v1', () => {
	const routes = Object.values(endpoints).map(({ method, path }) => `${method} ${path}`)
	assert.equal(new Set(routes).size, routes.length)
	for (const route of routes) assert.match(route, /^(GET|POST|PATCH|DELETE) \/api\/app\/v1\//)
})

test('a Today answer with a malformed Kept day is rejected, not passed through', () => {
	const today = {
		today: '2026-11-04',
		day: 3,
		step: 'report',
		promise: { wording: 'walk', moment: 'lunch', promiseDay: '2026-11-04', status: 'dueToday' },
		strip: [{ day: 3, outcome: 'open' }],
		week: { kept: 1, total: 2 },
		streak: {
			days: 0,
			best: 0,
			isForgivenessReady: true,
			inARow: 0,
			comebacks: 0,
			comebackToday: null
		},
		milestone: null,
		checkIn: { step: 'report', promiseId: 'p1', when: 'today' },
		changeableReport: null,
		unreported: false
	}
	assert.equal(todayResponse.safeParse(today).success, true)
	assert.equal(todayResponse.safeParse({ ...today, today: '4 Nov' }).success, false)
	// A Partly counts as half, so a week can be 1.5 of 2 kept.
	assert.equal(todayResponse.safeParse({ ...today, week: { kept: 1.5, total: 2 } }).success, true)
	assert.equal(todayResponse.safeParse({ ...today, step: 'celebrate' }).success, false)
	assert.equal(
		todayResponse.safeParse({ ...today, checkIn: { step: 'report', when: 'today' } }).success,
		false
	)
})

test('an error body names a known code', () => {
	assert.equal(
		errorBodySchema.safeParse({ error: { code: 'internal', message: 'x' } }).success,
		true
	)
	assert.equal(
		errorBodySchema.safeParse({ error: { code: 'teapot', message: 'x' } }).success,
		false
	)
})
