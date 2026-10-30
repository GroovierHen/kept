import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatPence } from './money.ts'

test("shows the walkthrough's amounts the way it writes them", () => {
	assert.equal(formatPence({ pence: 900 }), '£9')
	assert.equal(formatPence({ pence: 250 }), '£2.50')
	assert.equal(formatPence({ pence: 1150 }), '£11.50')
	assert.equal(formatPence({ pence: 65 }), '65p')
	assert.equal(formatPence({ pence: 2_000_000 }), '£20,000')
	assert.equal(formatPence({ pence: 0 }), '£0')
})

test('keeps both digits of the pence next to thousands of pounds', () => {
	assert.equal(formatPence({ pence: 123_405 }), '£1,234.05')
})

test('rounded shows whole pounds, for figures the walkthrough says "about" about', () => {
	assert.equal(formatPence({ pence: 1101, isRounded: true }), '£11')
	assert.equal(formatPence({ pence: 904, isRounded: true }), '£9')
	assert.equal(formatPence({ pence: 2_220_049, isRounded: true }), '£22,200')
})

test('rounded keeps pence under a pound, so 65p a day does not read as £1', () => {
	assert.equal(formatPence({ pence: 65, isRounded: true }), '65p')
})

test('an amount that rounds up to a pound is shown in pounds, not 100p', () => {
	assert.equal(formatPence({ pence: 99.6 }), '£1')
	assert.equal(formatPence({ pence: 99.6, isRounded: true }), '£1')
})

test('a negative amount puts the sign before the £', () => {
	assert.equal(formatPence({ pence: -12_600 }), '-£126')
	assert.equal(formatPence({ pence: -65 }), '-65p')
})
