import 'server-only'
import type { TodayResponse } from '@kept/contract'
import { checkInStep } from '@/lib/check-in'
import { addDays, dayNumber, promiseStatus, type KeptDay } from '@/lib/kept-day'
import { dayOutcomes } from '@/lib/ledger'
import { db } from '@/server/db/client'
import { getDueReviews, getTodaysLesson } from '@/server/learn/learn'
import { hasLearnedOn } from '@/server/learn/teach-lesson'
import { readCheckIn } from './read-check-in'
import { readLedger } from './read-ledger'

const STRIP_DAYS = 7

/**
 * What the Today screen shows before any step is opened: the step the Act loop
 * picks, the Promise it is about, the last seven days and the next milestone.
 * Worked out the way the web Today page works it out (src/app/[locale]/today).
 */
export async function readTodaySummary(userId: string): Promise<TodayResponse> {
	const { today, day, latestPromise } = await readCheckIn({ client: db, userId })
	const [dueReviews, lesson, hasLearnedToday, ledger] = await Promise.all([
		getDueReviews(userId, today),
		getTodaysLesson(userId, today),
		hasLearnedOn({ userId, today }),
		readLedger(userId)
	])
	const step = checkInStep({
		today,
		latestPromise,
		hasLearned: dueReviews.length === 0 && (hasLearnedToday || lesson == null)
	})
	const dayOf = (keptDay: KeptDay) => dayNumber({ signUpDay: ledger.signUpDay, today: keptDay })
	const stripStart = addDays({ day: today, days: 1 - STRIP_DAYS })
	const strip = dayOutcomes({
		ledger: ledger.ledger,
		promiseDays: ledger.promises.map(({ promiseDay }) => promiseDay),
		from: stripStart > ledger.signUpDay ? stripStart : ledger.signUpDay,
		today
	}).map(({ day: keptDay, outcome }) => ({ day: dayOf(keptDay), outcome }))

	return {
		today,
		day,
		step,
		promise:
			latestPromise == null
				? null
				: {
						wording: latestPromise.wording,
						moment: latestPromise.moment,
						promiseDay: latestPromise.promiseDay,
						status: promiseStatus({ promiseDay: latestPromise.promiseDay, today })
					},
		strip,
		week: { kept: ledger.ledger.week.kept, total: ledger.ledger.week.total },
		milestone:
			ledger.milestone == null
				? null
				: { text: ledger.milestone.text, daysLeft: ledger.milestone.daysLeft }
	}
}
