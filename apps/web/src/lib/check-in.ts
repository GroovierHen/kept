import { isReportEditable, isReportOpen, promiseStatus, type KeptDay } from './kept-day'

// The Act loop: which step of the Check-in the Today screen shows (GLOSSARY.md),
// and what the user can still correct. Always worked out from what's saved and
// the Kept day it's given, never stored.

export type CheckInStep = 'report' | 'learn' | 'commit' | 'done'

export interface LatestPromise {
	readonly promiseDay: KeptDay
	/** The Kept day it was made on, which comes before promiseDay unless the user came back late. */
	readonly committedOn: KeptDay
	/** The Kept day of its latest Report, null with none. */
	readonly reportedOn: KeptDay | null
}

/**
 * A Promise closes unreported after the Kept day following its own, so a user
 * coming back after a gap skips the Report. A user who reported on an earlier
 * Kept day and left goes straight to the commit step. `latestPromise` is null
 * only if a user somehow finished setup without one.
 */
export function checkInStep({
	today,
	latestPromise,
	hasLearned
}: {
	today: KeptDay
	latestPromise: LatestPromise | null
	hasLearned: boolean
}): CheckInStep {
	if (latestPromise == null) return 'commit'
	if (latestPromise.committedOn === today) return 'done'

	const { promiseDay, reportedOn } = latestPromise
	const status = promiseStatus({ promiseDay, today })
	if (status === 'upcoming') return 'done'
	if (reportedOn == null && isReportOpen(status)) return 'report'
	if (reportedOn != null && reportedOn !== today) return 'commit'
	return hasLearned ? 'commit' : 'learn'
}

/** True while the user's return after a gap hasn't been followed by a new Promise. */
export function closedAsUnreported({
	today,
	latestPromise
}: {
	today: KeptDay
	latestPromise: LatestPromise | null
}): boolean {
	if (latestPromise == null || latestPromise.reportedOn != null) return false
	return promiseStatus({ promiseDay: latestPromise.promiseDay, today }) === 'unreported'
}

/** A first Report follows the Promise's window, and a changed one the Kept day it was made on. */
export function canReport({
	promiseDay,
	reportedOn,
	today
}: {
	promiseDay: KeptDay
	reportedOn: KeptDay | null
	today: KeptDay
}): boolean {
	if (reportedOn != null) return isReportEditable({ reportedOn, today })
	return isReportOpen(promiseStatus({ promiseDay, today }))
}

/** A committed Promise can be changed until the 4am after it was made, before any Report on it. */
export function canChangePromise({
	committedOn,
	reportedOn,
	today
}: {
	committedOn: KeptDay
	reportedOn: KeptDay | null
	today: KeptDay
}): boolean {
	return committedOn === today && reportedOn == null
}
