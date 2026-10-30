import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseGoal, splitGoal } from './plan-preview.ts'

test('reads a goal the way people write it', () => {
	assert.deepEqual(parseGoal('£20,000 in 5 years'), { amount: 20000, months: 60 })
	assert.deepEqual(parseGoal('A £6,000 safety net in 2 years'), { amount: 6000, months: 24 })
	assert.deepEqual(parseGoal('£1,200 for a holiday in 12 months'), { amount: 1200, months: 12 })
	assert.deepEqual(parseGoal('50k in 8 yrs'), { amount: 50000, months: 96 })
	assert.deepEqual(parseGoal('in 3 years I want 9000'), { amount: 9000, months: 36 })
})

test('needs both an amount and a time', () => {
	assert.equal(parseGoal('£20,000'), null)
	assert.equal(parseGoal('in 5 years'), null)
	assert.equal(parseGoal('£0 in 5 years'), null)
	assert.equal(parseGoal('£500 in 0 months'), null)
	assert.equal(parseGoal(''), null)
})

test("matches Sara's plan in the walkthrough", () => {
	const plan = splitGoal({ amount: 20000, months: 60 })
	assert.equal(plan.year, 4000)
	assert.equal(plan.month, 335)
	assert.equal(plan.week, 77)
	assert.equal(plan.day, 11)
	assert.deepEqual(plan.grown, { total: 22200, interest: 2100 })
})

test('keeps pennies on small daily targets', () => {
	const plan = splitGoal({ amount: 1200, months: 12 })
	assert.equal(plan.month, 100)
	assert.equal(plan.day, 3.29)
})

test('skips growth for a goal under a year', () => {
	const plan = splitGoal({ amount: 600, months: 6 })
	assert.equal(plan.year, 600)
	assert.equal(plan.grown, null)
})
