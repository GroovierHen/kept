import assert from 'node:assert/strict'
import { test } from 'node:test'
import { retryAuthCall, signUpOnce } from './auth-retry.ts'

// Supabase reports failures in the result rather than throwing. These fakes
// return results shaped the same way.
type Result = { label: string; error: { code?: string } | null }

const networkError = { code: 'network' }
const isRetryable = (error: unknown) => error === networkError
const retry = { sleep: async () => {} }

function scripted(results: Result[]) {
	let calls = 0
	const call = async () => {
		const result = results[Math.min(calls, results.length - 1)]
		calls += 1
		return result
	}
	return { call, calls: () => calls }
}

test('a network failure is retried until the call works', async () => {
	const getUser = scripted([
		{ label: 'down', error: networkError },
		{ label: 'user', error: null }
	])
	const result = await retryAuthCall(getUser.call, { isRetryable, retry })
	assert.equal(result.label, 'user')
	assert.equal(getUser.calls(), 2)
})

test('an answer such as a wrong password is returned at once, not retried', async () => {
	const signIn = scripted([{ label: 'wrong', error: { code: 'invalid_credentials' } }])
	const result = await retryAuthCall(signIn.call, { isRetryable, retry })
	assert.equal(result.label, 'wrong')
	assert.equal(signIn.calls(), 1)
})

test('a network failure on every attempt is thrown', async () => {
	const signIn = scripted([{ label: 'down', error: networkError }])
	await assert.rejects(
		retryAuthCall(signIn.call, { isRetryable, retry }),
		(error) => error === networkError
	)
	assert.equal(signIn.calls(), 3)
})

test('a sign-up that worked on the retry needs no sign-in', async () => {
	const signUp = scripted([
		{ label: 'down', error: networkError },
		{ label: 'created', error: null }
	])
	const signIn = scripted([{ label: 'signed in', error: null }])
	const result = await signUpOnce({ signUp: signUp.call, signIn: signIn.call, isRetryable, retry })
	assert.equal(result.label, 'created')
	assert.equal(signIn.calls(), 0)
})

// The case that lost people: the first try made the account but its answer
// was lost, so the retry said the email was taken.
test('"taken" after a lost first try signs in with the same password instead', async () => {
	const signUp = scripted([
		{ label: 'lost', error: networkError },
		{ label: 'taken', error: { code: 'user_already_exists' } }
	])
	const signIn = scripted([{ label: 'signed in', error: null }])
	const result = await signUpOnce({ signUp: signUp.call, signIn: signIn.call, isRetryable, retry })
	assert.equal(result.label, 'signed in')
	assert.equal(signIn.calls(), 1)
})

test('"taken" on the first try is a real taken email, with no sign-in', async () => {
	const signUp = scripted([{ label: 'taken', error: { code: 'email_exists' } }])
	const signIn = scripted([{ label: 'signed in', error: null }])
	const result = await signUpOnce({ signUp: signUp.call, signIn: signIn.call, isRetryable, retry })
	assert.equal(result.label, 'taken')
	assert.equal(signIn.calls(), 0)
})

test("someone else's account stays taken when the password doesn't match", async () => {
	const signUp = scripted([
		{ label: 'lost', error: networkError },
		{ label: 'taken', error: { code: 'user_already_exists' } }
	])
	const signIn = scripted([{ label: 'wrong', error: { code: 'invalid_credentials' } }])
	const result = await signUpOnce({ signUp: signUp.call, signIn: signIn.call, isRetryable, retry })
	assert.equal(result.label, 'taken')
})
