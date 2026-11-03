import assert from 'node:assert/strict'
import { test } from 'node:test'
import { provisionOrSignOut } from './provision-or-sign-out.ts'

// Reproduced on localhost: when saving the User row failed after Supabase had
// opened the session, the person stayed signed in with no row, never saw the
// error, and was stuck on setup's last step with no signed_up Event.

test('a failed save closes the session and reports the original error', async () => {
	const saveFailed = new Error('users insert failed')
	let signOuts = 0
	await assert.rejects(
		provisionOrSignOut({
			provision: async () => {
				throw saveFailed
			},
			signOut: async () => {
				signOuts += 1
			}
		}),
		saveFailed
	)
	assert.equal(signOuts, 1)
})

test('a successful save keeps the session', async () => {
	let signOuts = 0
	await provisionOrSignOut({
		provision: async () => {},
		signOut: async () => {
			signOuts += 1
		}
	})
	assert.equal(signOuts, 0)
})

test('when closing the session also fails, both errors are reported', async () => {
	const saveFailed = new Error('users insert failed')
	const signOutFailed = new Error('supabase unreachable')
	await assert.rejects(
		provisionOrSignOut({
			provision: async () => {
				throw saveFailed
			},
			signOut: async () => {
				throw signOutFailed
			}
		}),
		(error: unknown) =>
			error instanceof AggregateError &&
			error.errors[0] === saveFailed &&
			error.errors[1] === signOutFailed
	)
})
