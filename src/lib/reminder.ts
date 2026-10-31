import { z } from 'zod'
import { addDays, ROLLOVER_HOUR, type KeptDay } from '@/lib/kept-day'

// The one repeating calendar event a user adds in setup (docs/product/tasks.md,
// "Daily reminder"), as an .ics file or a Google Calendar link. Kept never sends
// it; the user's calendar does.

export const DEFAULT_REMINDER_TIME = '20:00'
const REMINDER_MINUTES = 15

export const reminderTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

/**
 * The first reminder falls on the first Promise's day. A time before the 4am
 * rollover still belongs to the Kept day before, when that Promise isn't due
 * yet, so it starts a day later.
 */
export function firstReminderDay({ promiseDay, time }: { promiseDay: KeptDay; time: string }) {
	const hour = Number(time.slice(0, 2))
	return hour < ROLLOVER_HOUR ? addDays({ day: promiseDay, days: 1 }) : promiseDay
}

interface ReminderEvent {
	readonly startDay: KeptDay
	readonly time: string
	readonly timeZone: string
	readonly title: string
	readonly details: string
}

function localStamp({ day, time }: { day: KeptDay; time: string }): string {
	return `${day.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function endStamp({ startDay, time }: { startDay: KeptDay; time: string }): string {
	const end = new Date(`${startDay}T${time}:00Z`)
	end.setUTCMinutes(end.getUTCMinutes() + REMINDER_MINUTES)
	const [day = '', clock = ''] = end.toISOString().split('T')
	return localStamp({ day, time: clock.slice(0, 5) })
}

export function googleCalendarUrl({
	startDay,
	time,
	timeZone,
	title,
	details
}: ReminderEvent): string {
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: title,
		dates: `${localStamp({ day: startDay, time })}/${endStamp({ startDay, time })}`,
		ctz: timeZone,
		recur: 'RRULE:FREQ=DAILY',
		details
	})
	return `https://calendar.google.com/calendar/render?${params}`
}

function escapeIcsText(text: string): string {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll(';', '\;')
		.replaceAll(',', '\\,')
		.replaceAll('\n', '\\n')
}

// RFC 5545 asks for lines of at most 75 octets, continued with a leading space.
function foldIcsLine(line: string): string {
	const encoder = new TextEncoder()
	const pieces: string[] = []
	let piece = ''
	for (const character of line) {
		const limit = pieces.length === 0 ? 75 : 74
		if (encoder.encode(piece + character).length > limit) {
			pieces.push(piece)
			piece = ''
		}
		piece += character
	}
	pieces.push(piece)
	return pieces.join('\r\n ')
}

/**
 * The uid is fixed per user, so adding the file a second time replaces the
 * event in calendars that honour it rather than adding another.
 */
export function reminderIcs({
	uid,
	url,
	now,
	startDay,
	time,
	timeZone,
	title,
	details
}: ReminderEvent & { uid: string; url: string; now: Date }): string {
	const stamp = now
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d+Z$/, 'Z')
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Kept//Daily reminder//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${stamp}`,
		`DTSTART;TZID=${timeZone}:${localStamp({ day: startDay, time })}`,
		`DURATION:PT${REMINDER_MINUTES}M`,
		'RRULE:FREQ=DAILY',
		`SUMMARY:${escapeIcsText(title)}`,
		`DESCRIPTION:${escapeIcsText(details)}`,
		`URL:${url}`,
		'BEGIN:VALARM',
		'ACTION:DISPLAY',
		`DESCRIPTION:${escapeIcsText(title)}`,
		'TRIGGER:PT0M',
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR'
	]
	return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}
