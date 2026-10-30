import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseEvent } from './kept-events.ts'

const userId = '6f1d2c3a-0b4e-4f7a-9c21-1a2b3c4d5e6f'
const promiseId = '0c9e8d7f-6a5b-4c3d-8e2f-9a8b7c6d5e4f'

test('a signed up Event carries the user and the Kept day, and no details', () => {
	assert.deepEqual(parseEvent({ userId, name: 'signed_up', keptDay: '2026-10-30', details: {} }), {
		userId,
		name: 'signed_up',
		keptDay: new Date('2026-10-30T00:00:00Z'),
		details: {}
	})
})

test('a promise committed Event keeps its ids, enums and pence', () => {
	const details = {
		promiseId,
		promiseDay: '2026-10-31',
		actionId: 'cook-instead',
		size: 'small',
		moment: 'after_work',
		savingPence: 900
	}
	assert.deepEqual(
		parseEvent({ userId, name: 'promise_committed', keptDay: '2026-10-30', details }).details,
		details
	)
})

test('a Typed promise is committed with no Action, Size or pence', () => {
	const details = {
		promiseId,
		promiseDay: '2026-10-31',
		actionId: null,
		size: null,
		moment: 'lunch',
		savingPence: null
	}
	assert.deepEqual(
		parseEvent({ userId, name: 'promise_committed', keptDay: '2026-10-30', details }).details,
		details
	)
})

test('a promise committed Event says which day the Promise is for, apart from the day of the tap', () => {
	assert.throws(() =>
		parseEvent({
			userId,
			name: 'promise_committed',
			keptDay: '2026-10-30',
			details: { promiseId, actionId: null, size: null, moment: 'lunch', savingPence: null }
		})
	)
})

test('a report made Event says which day the Promise was for', () => {
	const details = { promiseId, promiseDay: '2026-10-30', answer: 'partly' }
	assert.deepEqual(
		parseEvent({ userId, name: 'report_made', keptDay: '2026-10-31', details }).details,
		details
	)
})

test('free text cannot get into an Event', () => {
	const event = { userId, keptDay: '2026-10-30' }
	assert.throws(() =>
		parseEvent({ ...event, name: 'signed_up', details: { email: 'sara@example.com' } })
	)
	assert.throws(() =>
		parseEvent({
			...event,
			name: 'promise_committed',
			details: {
				promiseId,
				promiseDay: '2026-10-31',
				actionId: 'Stop buying coffee on the way to work',
				size: null,
				moment: 'lunch',
				savingPence: null
			}
		})
	)
	assert.throws(() =>
		parseEvent({
			...event,
			name: 'i_think_i_was_right_pressed',
			details: { questionId: 'because I meant the other fund' }
		})
	)
})

test('pence are whole numbers', () => {
	assert.throws(() =>
		parseEvent({
			userId,
			name: 'promise_committed',
			keptDay: '2026-10-30',
			details: {
				promiseId,
				promiseDay: '2026-10-31',
				actionId: null,
				size: null,
				moment: 'lunch',
				savingPence: 2.5
			}
		})
	)
})

test('an Event name off the list is refused', () => {
	assert.throws(() =>
		parseEvent({ userId, name: 'page_viewed', keptDay: '2026-10-30', details: {} })
	)
})

test('a Kept day must be a real calendar date', () => {
	const event = { userId, name: 'signed_up', details: {} }
	assert.throws(() => parseEvent({ ...event, keptDay: '30/10/2026' }))
	assert.throws(() => parseEvent({ ...event, keptDay: '2026-02-30' }))
})

// A repeated submission (a double tap, a retry after a lost answer, an entry
// replayed from the outbox) carries the same key, and the database keeps one.
test('an Event can carry an idempotency key', () => {
	const event = parseEvent({
		userId,
		name: 'report_made',
		keptDay: '2026-10-30',
		details: { promiseId, promiseDay: '2026-10-30', answer: 'yes' },
		idempotencyKey: `report_made:${promiseId}`
	})
	assert.equal(event.idempotencyKey, `report_made:${promiseId}`)
})

test('an Event without a key has none', () => {
	const event = parseEvent({ userId, name: 'signed_up', keptDay: '2026-10-30', details: {} })
	assert.equal('idempotencyKey' in event, false)
})

test('an idempotency key is a short token, never free text', () => {
	for (const idempotencyKey of ['', 'Has Spaces', 'x'.repeat(129), 'drop table;']) {
		assert.throws(() =>
			parseEvent({ userId, name: 'signed_up', keptDay: '2026-10-30', details: {}, idempotencyKey })
		)
	}
})
