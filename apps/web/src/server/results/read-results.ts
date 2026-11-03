import 'server-only'
import { unstable_cache } from 'next/cache'
import { keptDayFromDate } from '@/lib/kept-day'
import {
	buildRecallResults,
	buildResults,
	RESULTS_EVENT_NAMES,
	type ResultsEvent
} from '@/lib/results'
import { db } from '@/server/db/client'
import { getRecallProgress } from '@/server/learn/learn'
import { COUNTED_ACCOUNTS } from './counted-accounts'

// The page is public and every view would otherwise read all of these Events
// (ADR 0002 keeps that fine for a cohort), so views share one read a minute.
const REVALIDATE_SECONDS = 60

const isResultsEventName = (name: string): name is ResultsEvent['name'] =>
	RESULTS_EVENT_NAMES.some((each) => each === name)

async function readResults() {
	const [rows, recall] = await Promise.all([
		db.event.findMany({
			where: { name: { in: [...RESULTS_EVENT_NAMES] }, user: COUNTED_ACCOUNTS },
			select: {
				id: true,
				userId: true,
				name: true,
				keptDay: true,
				occurredAt: true,
				details: true,
				user: { select: { timeZone: true } }
			}
		}),
		getRecallProgress()
	])
	const events = rows.flatMap(({ user, keptDay, name, ...row }) =>
		isResultsEventName(name)
			? [{ ...row, name, keptDay: keptDayFromDate(keptDay), timeZone: user.timeZone }]
			: []
	)
	return { results: buildResults({ events, now: new Date() }), recall: buildRecallResults(recall) }
}

export const getResults = unstable_cache(readResults, ['results-page'], {
	revalidate: REVALIDATE_SECONDS
})
