import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { isBuildRunning, PLAN_BUILD_LIMIT_SECONDS, secondsSince } from './plan-build.ts'

const NOW = new Date('2026-11-02T12:00:00Z')
const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000)

test('a build claimed within the time limit is still running', () => {
	assert.equal(isBuildRunning({ startedAt: secondsAgo(5), now: NOW }), true)
	assert.equal(
		isBuildRunning({ startedAt: secondsAgo(PLAN_BUILD_LIMIT_SECONDS - 1), now: NOW }),
		true
	)
})

// The request that made the claim was stopped at the time limit, so nothing
// will save a plan or hand the claim back: the person can build again.
test('a build claimed longer ago than the time limit died, and is not running', () => {
	assert.equal(isBuildRunning({ startedAt: secondsAgo(PLAN_BUILD_LIMIT_SECONDS), now: NOW }), false)
	assert.equal(isBuildRunning({ startedAt: secondsAgo(3600), now: NOW }), false)
})

test('a refreshed wait carries on from how long the build has run', () => {
	assert.equal(secondsSince({ startedAt: secondsAgo(12.6), now: NOW }), 12)
})

// A Next.js segment config must be a literal, so the page can't import the
// limit: this keeps the two from drifting apart.
test("the build limit is the setup page's maxDuration", () => {
	const page = readFileSync('src/app/[locale]/setup/page.tsx', 'utf8')
	assert.match(page, new RegExp(`export const maxDuration = ${PLAN_BUILD_LIMIT_SECONDS}\\b`))
})
