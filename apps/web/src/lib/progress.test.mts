import assert from 'node:assert/strict'
import { test } from 'node:test'
import { progressPercent } from './progress.ts'

test('shows how far a value gets toward its target', () => {
	assert.equal(progressPercent({ value: 500, max: 1000 }), 50)
	assert.equal(progressPercent({ value: 900, max: 1101 }), 82)
})

test('stops at 100%', () => {
	assert.equal(progressPercent({ value: 1000, max: 1000 }), 100)
	assert.equal(progressPercent({ value: 2500, max: 1000 }), 100)
})

test('only reaches 100% once the target is met, so £10.95 of £11 is not a full bar', () => {
	assert.equal(progressPercent({ value: 1095, max: 1100 }), 99)
})

test('stays at 0% when there is nothing to show', () => {
	assert.equal(progressPercent({ value: 0, max: 1000 }), 0)
	assert.equal(progressPercent({ value: -100, max: 1000 }), 0)
	assert.equal(progressPercent({ value: 500, max: 0 }), 0)
	assert.equal(progressPercent({ value: Number.NaN, max: 1000 }), 0)
	assert.equal(progressPercent({ value: 500, max: Number.NaN }), 0)
})
