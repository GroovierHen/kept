import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	dayNumber,
	isReportEditable,
	nextPromiseDay,
	promiseStatus,
	resolveTimeZone,
	toKeptDay
} from './kept-day.ts'

test('a Kept day rolls over at 4am local time, not midnight', () => {
	const timeZone = 'Europe/London'
	assert.equal(toKeptDay({ instant: new Date('2026-10-15T20:00:00Z'), timeZone }), '2026-10-15')
	assert.equal(toKeptDay({ instant: new Date('2026-10-15T23:30:00Z'), timeZone }), '2026-10-15')
	assert.equal(toKeptDay({ instant: new Date('2026-10-16T02:59:00Z'), timeZone }), '2026-10-15')
	assert.equal(toKeptDay({ instant: new Date('2026-10-16T03:00:00Z'), timeZone }), '2026-10-16')
})

test('a Kept day follows the user’s own time zone', () => {
	const instant = new Date('2026-10-15T19:00:00Z')
	assert.equal(toKeptDay({ instant, timeZone: 'Asia/Tokyo' }), '2026-10-16')
	assert.equal(toKeptDay({ instant, timeZone: 'America/New_York' }), '2026-10-15')
	assert.equal(
		toKeptDay({ instant: new Date('2026-10-15T18:59:00Z'), timeZone: 'Asia/Tokyo' }),
		'2026-10-15'
	)
})

test('the rollover stays at 4am on the nights the clocks change', () => {
	const timeZone = 'Europe/London'
	// Clocks go forward at 01:00 UTC on 29 March 2026: 03:30 UTC is 04:30 local.
	assert.equal(toKeptDay({ instant: new Date('2026-03-29T03:30:00Z'), timeZone }), '2026-03-29')
	assert.equal(toKeptDay({ instant: new Date('2026-03-29T02:30:00Z'), timeZone }), '2026-03-28')
	// Clocks go back at 01:00 UTC on 25 October 2026: 02:30 UTC is 02:30 local.
	assert.equal(toKeptDay({ instant: new Date('2026-10-25T02:30:00Z'), timeZone }), '2026-10-24')
	assert.equal(toKeptDay({ instant: new Date('2026-10-25T04:00:00Z'), timeZone }), '2026-10-25')
})

test('a valid browser time zone is kept as the user’s time zone', () => {
	assert.equal(resolveTimeZone('Asia/Tokyo'), 'Asia/Tokyo')
	assert.equal(resolveTimeZone('America/New_York'), 'America/New_York')
})

test('a time zone is stored under its canonical name', () => {
	assert.equal(resolveTimeZone('europe/london'), 'Europe/London')
})

// A sign-up sent before the page's JavaScript runs has no browser time zone.
// Falling straight to London rolled a Karachi tester's day over at 9am, not 4am.
test("a missing browser time zone uses the request's time zone before London", () => {
	assert.equal(resolveTimeZone('', 'Asia/Karachi'), 'Asia/Karachi')
	assert.equal(resolveTimeZone(null, 'Asia/Karachi'), 'Asia/Karachi')
	assert.equal(resolveTimeZone('Mars/Olympus', 'Asia/Karachi'), 'Asia/Karachi')
})

test("the browser's time zone wins over the request's", () => {
	assert.equal(resolveTimeZone('Europe/Paris', 'Asia/Karachi'), 'Europe/Paris')
})

test('a missing or invalid time zone falls back to Europe/London', () => {
	assert.equal(resolveTimeZone('', null), 'Europe/London')
	assert.equal(resolveTimeZone('', 'Mars/Olympus'), 'Europe/London')
	for (const value of [undefined, null, '', 'Mars/Olympus', 'not a zone', 42]) {
		assert.equal(resolveTimeZone(value), 'Europe/London')
	}
})

test('a promise is due on its own day and the day after, then goes unreported', () => {
	const promiseDay = '2026-10-15'
	assert.equal(promiseStatus({ promiseDay, today: '2026-10-14' }), 'upcoming')
	assert.equal(promiseStatus({ promiseDay, today: '2026-10-15' }), 'dueToday')
	assert.equal(promiseStatus({ promiseDay, today: '2026-10-16' }), 'dueYesterday')
	assert.equal(promiseStatus({ promiseDay, today: '2026-10-17' }), 'unreported')
	assert.equal(promiseStatus({ promiseDay, today: '2026-10-29' }), 'unreported')
})

test('the reporting window counts calendar days across month and year ends', () => {
	assert.equal(promiseStatus({ promiseDay: '2026-10-31', today: '2026-11-01' }), 'dueYesterday')
	assert.equal(promiseStatus({ promiseDay: '2026-12-31', today: '2027-01-02' }), 'unreported')
})

test('the first promise, made at setup, is always for tomorrow', () => {
	assert.equal(nextPromiseDay({ today: '2026-10-29', latestPromiseDay: null }), '2026-10-30')
})

test('reporting on time commits the next promise for tomorrow', () => {
	assert.equal(
		nextPromiseDay({ today: '2026-10-29', latestPromiseDay: '2026-10-29' }),
		'2026-10-30'
	)
})

test('a late report or a return after a gap commits the next promise for today', () => {
	assert.equal(
		nextPromiseDay({ today: '2026-10-29', latestPromiseDay: '2026-10-28' }),
		'2026-10-29'
	)
	assert.equal(
		nextPromiseDay({ today: '2026-10-29', latestPromiseDay: '2026-10-20' }),
		'2026-10-29'
	)
})

test('no new promise can be committed while a later one is still upcoming', () => {
	assert.throws(() => nextPromiseDay({ today: '2026-10-29', latestPromiseDay: '2026-10-30' }))
})

test('a report can be changed until its Kept day rolls over', () => {
	assert.equal(isReportEditable({ reportedOn: '2026-10-29', today: '2026-10-29' }), true)
	assert.equal(isReportEditable({ reportedOn: '2026-10-29', today: '2026-10-30' }), false)
})

test('Day N counts Kept days from the sign-up day, which is Day 1', () => {
	assert.equal(dayNumber({ signUpDay: '2026-10-29', today: '2026-10-29' }), 1)
	assert.equal(dayNumber({ signUpDay: '2026-10-29', today: '2026-10-30' }), 2)
	assert.equal(dayNumber({ signUpDay: '2026-10-29', today: '2026-11-02' }), 5)
})
