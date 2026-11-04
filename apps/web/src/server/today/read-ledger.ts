import 'server-only'
import { keptDayFromDate, toKeptDay } from '@/lib/kept-day'
import { buildLedger, nextMilestone, ownRecallProgress } from '@/lib/ledger'
import { buildStreak, checkInDaysOf } from '@/lib/streak'
import { db } from '@/server/db/client'
import { LEDGER_EVENT_NAMES, parseLedgerEvent } from '@/server/events/kept-events'
import { getDueMilestone, getPlan, getRecallProgress } from '@/server/learn/learn'

/** Everything the ledger screen shows for one user: their Events and Promises, and what Learn holds. */
export async function readLedger(userId: string) {
	const { timeZone, createdAt, events, promises } = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			timeZone: true,
			createdAt: true,
			promises: {
				orderBy: { promiseDay: 'asc' },
				select: { promiseDay: true, wording: true, moment: true }
			},
			events: {
				where: { name: { in: [...LEDGER_EVENT_NAMES] } },
				// Rows saved in one transaction share a time, and uuid(7) ids are time-ordered.
				orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
				select: { name: true, details: true, keptDay: true }
			}
		}
	})
	const today = toKeptDay({ instant: new Date(), timeZone })
	const signUpDay = toKeptDay({ instant: createdAt, timeZone })

	const [plan, dueMilestone, recallProgress] = await Promise.all([
		getPlan(userId),
		getDueMilestone(userId, today),
		getRecallProgress(userId)
	])

	return {
		today,
		signUpDay,
		promises: promises.map((promise) => ({
			...promise,
			promiseDay: keptDayFromDate(promise.promiseDay)
		})),
		goal: plan.goal,
		milestones: plan.milestones,
		ledger: buildLedger({ events: events.map(parseLedgerEvent), today }),
		streak: buildStreak({
			checkInDays: checkInDaysOf(
				events.map(({ name, keptDay }) => ({ name, keptDay: keptDayFromDate(keptDay) }))
			),
			today
		}),
		actions: plan.actions,
		milestone:
			dueMilestone == null
				? nextMilestone({ milestones: plan.milestones, signUpDay, today })
				: { ...dueMilestone, daysLeft: 0 },
		recallProgress: ownRecallProgress(recallProgress)
	}
}
