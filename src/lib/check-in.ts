import { isReportOpen, promiseStatus, type KeptDay } from './kept-day'

// The Act loop: which step of the Check-in the Today screen shows (GLOSSARY.md).
// Always worked out from what's saved and the Kept day it's given, never stored.

export type CheckInStep = 'report' | 'learn' | 'commit' | 'done'

export interface LatestPromise {
	readonly promiseDay: KeptDay
	/** The Kept day it was made on, which comes before promiseDay unless the user came back late. */
	readonly committedOn: KeptDay
	readonly hasReport: boolean
}

/**
 * A Promise closes unreported after the Kept day following its own, so a user
 * coming back after a gap skips the Report. `latestPromise` is null only if a
 * user somehow finished setup without one.
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

	const status = promiseStatus({ promiseDay: latestPromise.promiseDay, today })
	if (status === 'upcoming') return 'done'
	if (!latestPromise.hasReport && isReportOpen(status)) return 'report'
	return hasLearned ? 'commit' : 'learn'
}
