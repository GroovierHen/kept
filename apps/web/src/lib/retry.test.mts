import assert from 'node:assert/strict'
import { test } from 'node:test'
import { backoffDelay, withRetry } from './retry.ts'

class Transient extends Error {}

const noWait = async () => {}
const isTransient = (error: unknown) => error instanceof Transient

test('a call that fails twice with a transient error succeeds on the third try', async () => {
	let calls = 0
	const result = await withRetry(
		async () => {
			calls += 1
			if (calls < 3) throw new Transient('connection reset')
			return 'saved'
		},
		{ isRetryable: isTransient, sleep: noWait }
	)
	assert.equal(result, 'saved')
	assert.equal(calls, 3)
})

test('it gives up after the last attempt and throws the last error', async () => {
	let calls = 0
	const last = new Transient('still down')
	await assert.rejects(
		withRetry(
			async () => {
				calls += 1
				throw calls === 3 ? last : new Transient('down')
			},
			{ attempts: 3, isRetryable: isTransient, sleep: noWait }
		),
		last
	)
	assert.equal(calls, 3)
})

test('an error that is not retryable is thrown at once', async () => {
	let calls = 0
	const invalid = new Error('invalid input')
	await assert.rejects(
		withRetry(
			async () => {
				calls += 1
				throw invalid
			},
			{ isRetryable: isTransient, sleep: noWait }
		),
		invalid
	)
	assert.equal(calls, 1)
})

test('the wait doubles each attempt up to the cap', () => {
	const delays = [1, 2, 3, 4, 5].map((attempt) =>
		backoffDelay({ attempt, baseDelayMs: 200, maxDelayMs: 1500, random: () => 1 })
	)
	assert.deepEqual(delays, [200, 400, 800, 1500, 1500])
})

test('the wait is jittered between zero and the cap', () => {
	assert.equal(backoffDelay({ attempt: 3, baseDelayMs: 200, maxDelayMs: 1500, random: () => 0 }), 0)
	assert.equal(
		backoffDelay({ attempt: 3, baseDelayMs: 200, maxDelayMs: 1500, random: () => 0.5 }),
		400
	)
})

test('it waits between attempts, not after the last one', async () => {
	const waits: number[] = []
	await assert.rejects(
		withRetry(
			async () => {
				throw new Transient('down')
			},
			{
				attempts: 3,
				baseDelayMs: 100,
				maxDelayMs: 1000,
				isRetryable: isTransient,
				random: () => 1,
				sleep: async (ms) => {
					waits.push(ms)
				}
			}
		)
	)
	assert.deepEqual(waits, [100, 200])
})

test('each attempt is told its number', async () => {
	const seen: number[] = []
	await withRetry(
		async (attempt) => {
			seen.push(attempt)
			if (attempt < 2) throw new Transient('down')
		},
		{ isRetryable: isTransient, sleep: noWait }
	)
	assert.deepEqual(seen, [1, 2])
})
