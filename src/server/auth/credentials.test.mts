import assert from 'node:assert/strict'
import { test } from 'node:test'
import { credentials } from './credentials.ts'

const valid = { email: 'sara@example.com', password: 'eight-chars', timeZone: 'Asia/Karachi' }

test('an email is trimmed and lowercased', () => {
	const parsed = credentials.parse({ ...valid, email: '  Sara@Example.COM ' })
	assert.equal(parsed.email, 'sara@example.com')
})

test('a password must be 8 to 72 characters', () => {
	assert.equal(credentials.safeParse({ ...valid, password: 'short' }).success, false)
	assert.equal(credentials.safeParse({ ...valid, password: 'x'.repeat(72) }).success, true)
	// Supabase refuses longer passwords, which surfaced as "something went wrong".
	assert.equal(credentials.safeParse({ ...valid, password: 'x'.repeat(73) }).success, false)
})

test('an email longer than an address can be is refused', () => {
	const email = `${'a'.repeat(250)}@example.com`
	assert.equal(credentials.safeParse({ ...valid, email }).success, false)
})

test('a missing or unknown time zone never stops a sign-up', () => {
	assert.equal(credentials.parse({ ...valid, timeZone: undefined }).timeZone, 'Europe/London')
	assert.equal(credentials.parse({ ...valid, timeZone: 'Mars/Olympus' }).timeZone, 'Europe/London')
})
