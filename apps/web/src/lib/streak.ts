// IN_A_ROW_TO_FORGIVE_AGAIN matches the three Yeses that grow a Promise a Size
// (src/lib/adaptive.ts). It lives in the contract so both apps can show the way back.
import { IN_A_ROW_TO_FORGIVE_AGAIN } from '@kept/contract'
import { addDays, type KeptDay } from './kept-day'

// The user's Streak, Best streak and Comebacks (GLOSSARY.md, ADR 0004), worked
// out from the Kept days they finished a Check-in on, never stored.

export interface Streak {
	/** Kept days in the current Streak, today included once its Check-in is finished. */
	readonly days: number
	readonly best: number
	/** True while the next Empty day would be forgiven rather than end the Streak. */
	readonly isForgivenessReady: boolean
	/**
	 * Finished Check-ins in a row since the last Empty day. Forgiveness comes back
	 * at IN_A_ROW_TO_FORGIVE_AGAIN; today's Check-in still to come doesn't break it.
	 */
	readonly inARow: number
	/** Finished Check-ins that came after an Empty day, whether it was forgiven or ended a Streak. */
	readonly comebacks: number
	/**
	 * Today's finished Check-in as a Comeback: `safe` when the Empty day was
	 * forgiven, `restarted` when it ended the Streak, null when it isn't one.
	 */
	readonly comebackToday: 'safe' | 'restarted' | null
}

/**
 * The Kept days a Check-in was finished on. Committing the next Promise is a
 * Check-in's last step, so each `promise_committed` Event's own Kept day is one.
 */
export function checkInDaysOf(
	events: readonly { readonly name: string; readonly keptDay: KeptDay }[]
): KeptDay[] {
	return events.filter(({ name }) => name === 'promise_committed').map(({ keptDay }) => keptDay)
}

export function buildStreak({
	checkInDays,
	today
}: {
	checkInDays: readonly KeptDay[]
	today: KeptDay
}): Streak {
	const finished = new Set(checkInDays)
	const [first] = [...finished].toSorted()
	let days = 0
	let best = 0
	let isForgivenessReady = true
	let inARow = 0
	let comebacks = 0
	let afterEmptyDay = false
	let comebackToday: Streak['comebackToday'] = null
	for (let day = first; day != null && day <= today; day = addDays({ day, days: 1 })) {
		if (finished.has(day)) {
			days += 1
			inARow += 1
			best = Math.max(best, days)
			if (afterEmptyDay) {
				comebacks += 1
				if (day === today) comebackToday = days > 1 ? 'safe' : 'restarted'
			}
			afterEmptyDay = false
			if (inARow >= IN_A_ROW_TO_FORGIVE_AGAIN) isForgivenessReady = true
		} else if (day !== today) {
			afterEmptyDay = true
			inARow = 0
			if (days === 0) continue
			if (isForgivenessReady) {
				isForgivenessReady = false
			} else {
				// The Streak ends. The next one earns its forgiveness with 3 in a row,
				// so checking in every other day can't keep starting forgiven Streaks.
				days = 0
			}
		}
	}
	return { days, best, isForgivenessReady, inARow, comebacks, comebackToday }
}
