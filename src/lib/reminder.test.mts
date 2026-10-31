import assert from 'node:assert/strict'
import { test } from 'node:test'
import { firstReminderDay, googleCalendarUrl, reminderIcs, reminderTime } from './reminder.ts'

const event = {
	startDay: '2026-11-01',
	time: '20:00',
	timeZone: 'Asia/Karachi',
	title: 'Open Kept and report back',
	details: 'Report back: https://kept.example/today'
}

test('a reminder time is a real 24 hour time', () => {
	for (const time of ['00:00', '08:05', '20:00', '23:59']) {
		assert.equal(reminderTime.parse(time), time)
	}
	for (const time of ['', '24:00', '8:00', '20:60', '20:00:00', 'soon']) {
		assert.throws(() => reminderTime.parse(time))
	}
})

test('the first reminder falls on the first Promise day', () => {
	assert.equal(firstReminderDay({ promiseDay: '2026-11-01', time: '20:00' }), '2026-11-01')
	assert.equal(firstReminderDay({ promiseDay: '2026-11-01', time: '04:00' }), '2026-11-01')
})

test('a reminder before the 4am rollover starts a day later, when that Promise is due', () => {
	assert.equal(firstReminderDay({ promiseDay: '2026-11-01', time: '03:59' }), '2026-11-02')
	assert.equal(firstReminderDay({ promiseDay: '2026-12-31', time: '00:30' }), '2027-01-01')
})

test('the Google Calendar link repeats daily at the chosen time in the time zone', () => {
	const params = new URL(googleCalendarUrl(event)).searchParams
	assert.equal(params.get('action'), 'TEMPLATE')
	assert.equal(params.get('text'), event.title)
	assert.equal(params.get('dates'), '20261101T200000/20261101T201500')
	assert.equal(params.get('ctz'), 'Asia/Karachi')
	assert.equal(params.get('recur'), 'RRULE:FREQ=DAILY')
	assert.equal(params.get('details'), event.details)
})

test('the Google Calendar event can end after midnight', () => {
	const params = new URL(googleCalendarUrl({ ...event, time: '23:50' })).searchParams
	assert.equal(params.get('dates'), '20261101T235000/20261102T000500')
})

const ics = (overrides = {}) =>
	reminderIcs({
		...event,
		uid: 'daily-reminder-1@kept',
		url: 'https://kept.example/today',
		now: new Date('2026-10-31T16:00:00.123Z'),
		...overrides
	})

test('the .ics file repeats daily at the chosen time and links to the Today screen', () => {
	const lines = ics().split('\r\n')
	for (const line of [
		'BEGIN:VCALENDAR',
		'UID:daily-reminder-1@kept',
		'DTSTAMP:20261031T160000Z',
		'DTSTART;TZID=Asia/Karachi:20261101T200000',
		'RRULE:FREQ=DAILY',
		'URL:https://kept.example/today',
		'END:VCALENDAR'
	]) {
		assert.ok(lines.includes(line), line)
	}
})

test('the .ics file escapes text and folds long lines', () => {
	const file = ics({ title: 'Report, back; now' })
	assert.ok(file.includes('SUMMARY:Report\\, back\; now'))
	const long = ics({ details: 'é'.repeat(200) })
	for (const line of long.split('\r\n')) {
		assert.ok(new TextEncoder().encode(line).length <= 75, line)
	}
	assert.ok(long.replaceAll('\r\n ', '').includes(`DESCRIPTION:${'é'.repeat(200)}`))
})
