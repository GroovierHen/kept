import { addDays, type KeptDay } from '@/lib/kept-day'
import { MAX_RECALLS_PER_DAY } from './lesson'

// When a key idea comes back (docs/product/walkthrough.md, "Ideas come back").
// Pure, so every rule is tested without a database or a clock.
//
// An idea returns 1, 3 and 7 days after it's learned: gaps of 1, 2 and 4
// days, each counted from the day it was actually recalled, so an idea that
// waits a day pushes the rest back with it. A 0 out of 2 starts it over, 1 day
// after that recall. A 1 or a 2 moves it on. After the third return it's done.

export const RETURN_GAPS = [1, 2, 4] as const

export type RecallScore = 0 | 1 | 2

export interface PastRecall {
	readonly keptDay: KeptDay
	readonly score: RecallScore
}

/** The Kept day the idea next comes back, or null once it has made all its returns. */
export function nextReturn({
	taughtOn,
	recalls
}: {
	taughtOn: KeptDay
	recalls: readonly PastRecall[]
}): KeptDay | null {
	let returnsPassed = 0
	let countFrom = taughtOn
	for (const recall of [...recalls].sort((a, b) => a.keptDay.localeCompare(b.keptDay))) {
		returnsPassed = recall.score === 0 ? 0 : returnsPassed + 1
		countFrom = recall.keptDay
	}
	const gap = RETURN_GAPS[returnsPassed]
	return gap == null ? null : addDays({ day: countFrom, days: gap })
}

/**
 * How many more ideas today's check-in asks about: at most 2 a day, counting the
 * ones already answered today, so a check-in stays at 2 minutes.
 */
export function recallsLeftToday({
	answeredToday,
	waiting
}: {
	answeredToday: number
	waiting: number
}): number {
	return Math.max(0, Math.min(waiting, MAX_RECALLS_PER_DAY - answeredToday))
}
