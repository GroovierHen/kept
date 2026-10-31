/** A Kept day as a plain `YYYY-MM-DD` calendar date. See GLOSSARY.md. */
export type KeptDay = string

export const ROLLOVER_HOUR = 4
const FALLBACK_TIME_ZONE = 'Europe/London'

/** The first valid time zone among `candidates`, in canonical form, else Europe/London. */
export function resolveTimeZone(...candidates: unknown[]): string {
	for (const value of candidates) {
		if (typeof value !== 'string' || value === '') continue
		try {
			return new Intl.DateTimeFormat('en-GB', { timeZone: value }).resolvedOptions().timeZone
		} catch {
			// Not a zone this runtime knows: try the next candidate.
		}
	}
	return FALLBACK_TIME_ZONE
}

export function addDays({ day, days }: { day: KeptDay; days: number }): KeptDay {
	const date = new Date(`${day}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + days)
	return date.toISOString().slice(0, 10)
}

/** A Kept day as a `@db.Date` column takes it: midnight UTC. */
export function keptDayDate(day: KeptDay): Date {
	return new Date(`${day}T00:00:00Z`)
}

/** A `@db.Date` column read back as a Kept day. */
export function keptDayOf(date: Date): KeptDay {
	return date.toISOString().slice(0, 10)
}

export type PromiseStatus = 'upcoming' | 'dueToday' | 'dueYesterday' | 'unreported'

export function promiseStatus({
	promiseDay,
	today
}: {
	promiseDay: KeptDay
	today: KeptDay
}): PromiseStatus {
	if (promiseDay > today) return 'upcoming'
	if (promiseDay === today) return 'dueToday'
	if (addDays({ day: promiseDay, days: 1 }) === today) return 'dueYesterday'
	return 'unreported'
}

/**
 * `latestPromiseDay` is null only at setup, before the user has made any promise.
 * Call only when no promise is open, so the latest promise is never still upcoming.
 */
export function nextPromiseDay({
	today,
	latestPromiseDay
}: {
	today: KeptDay
	latestPromiseDay: KeptDay | null
}): KeptDay {
	if (latestPromiseDay == null) return addDays({ day: today, days: 1 })
	if (latestPromiseDay > today) {
		throw new Error('Cannot commit a new promise while a later one is still upcoming')
	}
	const dayAfterLatest = addDays({ day: latestPromiseDay, days: 1 })
	return dayAfterLatest > today ? dayAfterLatest : today
}

export function isReportEditable({
	reportedOn,
	today
}: {
	reportedOn: KeptDay
	today: KeptDay
}): boolean {
	return reportedOn === today
}

/**
 * The one place Kept turns an instant into local time: a Kept day is local by definition.
 * Works from the local wall-clock hour rather than subtracting hours from the
 * instant, which would land on the wrong day on clock-change nights.
 */
export function toKeptDay({ instant, timeZone }: { instant: Date; timeZone: string }): KeptDay {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(instant)
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((candidate) => candidate.type === type)?.value
	const localDay = `${part('year')}-${part('month')}-${part('day')}`
	return Number(part('hour')) < ROLLOVER_HOUR ? addDays({ day: localDay, days: -1 }) : localDay
}
