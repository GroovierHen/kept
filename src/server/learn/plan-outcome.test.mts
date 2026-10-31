import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SARA_GENERATED_PLAN } from '../../lib/learn/sara-plan.ts'
import { outcomeOf } from './plan-outcome.ts'

test('a plan is saved', () => {
	assert.deepEqual(outcomeOf({ ok: true, plan: SARA_GENERATED_PLAN, attempts: 1 }), {
		save: SARA_GENERATED_PLAN
	})
})

test('an unsafe goal shows the safer one and reports nothing, since it is not a fault', () => {
	assert.deepEqual(outcomeOf({ ok: false, reason: 'unsafe', saferGoal: 'Lose 2 kg in 4 weeks' }), {
		state: { kind: 'unsafe', saferGoal: 'Lose 2 kg in 4 weeks' }
	})
})

test('Gemini being down shows "try again" and reports the original error', () => {
	const outage = new Error('503 Service Unavailable')
	assert.deepEqual(outcomeOf({ ok: false, reason: 'unavailable', error: outage }), {
		state: { kind: 'failed' },
		report: outage
	})
})

test('two answers in the wrong shape show "try again" and are reported', () => {
	const outcome = outcomeOf({ ok: false, reason: 'invalid' })
	assert.deepEqual('state' in outcome && outcome.state, { kind: 'failed' })
	assert.ok('report' in outcome && outcome.report instanceof Error)
})
