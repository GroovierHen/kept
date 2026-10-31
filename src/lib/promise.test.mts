import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_PROMISE_LENGTH, promiseChoice } from './promise.ts'

const actionId = '0c9e8d7f-6a5b-4c3d-8e2f-9a8b7c6d5e4f'

test('an action choice needs a real action id and a moment', () => {
	assert.deepEqual(promiseChoice.parse({ kind: 'action', moment: 'lunch', actionId }), {
		kind: 'action',
		moment: 'lunch',
		actionId
	})
	assert.throws(() =>
		promiseChoice.parse({ kind: 'action', moment: 'lunch', actionId: 'stub-action-0' })
	)
	assert.throws(() => promiseChoice.parse({ kind: 'action', moment: 'noon', actionId }))
})

test('a Typed promise is trimmed and must say something', () => {
	const typed = promiseChoice.parse({ kind: 'typed', moment: 'lunch', wording: '  walk home  ' })
	assert.deepEqual(typed, { kind: 'typed', moment: 'lunch', wording: 'walk home' })
	assert.throws(() => promiseChoice.parse({ kind: 'typed', moment: 'lunch', wording: '   ' }))
})

test('a Typed promise can be as long as an action and no longer', () => {
	const choice = (length: number) => ({
		kind: 'typed',
		moment: 'lunch',
		wording: 'x'.repeat(length)
	})
	assert.doesNotThrow(() => promiseChoice.parse(choice(MAX_PROMISE_LENGTH)))
	assert.throws(() => promiseChoice.parse(choice(MAX_PROMISE_LENGTH + 1)))
})
