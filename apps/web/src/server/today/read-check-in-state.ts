import 'server-only'
import { checkInStep } from '@/lib/check-in'
import { addDays, dayNumber } from '@/lib/kept-day'
import { dayOutcomes } from '@/lib/ledger'
import { db } from '@/server/db/client'
import { getDueReviews, getTodaysLesson } from '@/server/learn/learn'
import { hasLearnedOn } from '@/server/learn/teach-lesson'
import { readCheckIn } from './read-check-in'
import { readLedger } from './read-ledger'

const STRIP_DAYS = 7

/**
 * Everything the Today screen is worked out from, and the step the Act loop
 * picks (src/lib/check-in.ts). The web page and the app's GET /today both read
 * it here, so they can't disagree on what today's step is.
 */
export async function readCheckInState(userId: string) {
	const checkIn = await readCheckIn({ client: db, userId })
	const { today, latestPromise } = checkIn
	const [dueReviews, lesson, hasLearnedToday, ledger] = await Promise.all([
		getDueReviews(userId, today),
		getTodaysLesson(userId, today),
		hasLearnedOn({ userId, today }),
		readLedger(userId)
	])
	const step = checkInStep({
		today,
		latestPromise,
		// Learning is today's recalls first, then the new idea if there is one.
		hasLearned: dueReviews.length === 0 && (hasLearnedToday || lesson == null)
	})
	return { ...checkIn, dueReviews, lesson, hasLearnedToday, ledger, step }
}

export type CheckInState = Awaited<ReturnType<typeof readCheckInState>>

/** The last seven days up to today, oldest first, never before sign-up, by day number. */
export function recentDays({ today, ledger }: Pick<CheckInState, 'today' | 'ledger'>) {
	const stripStart = addDays({ day: today, days: 1 - STRIP_DAYS })
	return dayOutcomes({
		ledger: ledger.ledger,
		promiseDays: ledger.promises.map(({ promiseDay }) => promiseDay),
		from: stripStart > ledger.signUpDay ? stripStart : ledger.signUpDay,
		today
	}).map(({ day, outcome }) => ({
		day: dayNumber({ signUpDay: ledger.signUpDay, today: day }),
		outcome
	}))
}
