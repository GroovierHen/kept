import { z } from 'zod'
import { dayNumber, toKeptDay, type KeptDay } from '@/lib/kept-day'
import type { RecallProgress } from '@/lib/learn/plan'
import { REPORT_ANSWERS } from '@/lib/report'

// The results page's numbers, worked out from Events alone (ADR 0001). What comes
// out is counts and scores, never an id, a title or anything a tester typed, so
// the page has nothing private to show. Reminder added has no place here: it says
// someone tapped the button, not that a reminder exists.

/** Setup makes the first Promise for the next day, so no Report can come on Day 1. */
const FIRST_REPORT_DAY = 2

// A stub in src/server/learn/learn.ts marks its ids this way. Sara's made-up
// scores must never read as testers' scores on a public page.
const STUB_ID_PREFIX = 'stub-'

export const RESULTS_EVENT_NAMES = [
	'signed_up',
	'setup_finished',
	'report_made',
	'milestone_checked'
] as const

export interface ResultsEvent {
	readonly id: string
	readonly userId: string
	readonly name: (typeof RESULTS_EVENT_NAMES)[number]
	readonly keptDay: KeptDay
	readonly occurredAt: Date
	readonly details: unknown
	/** The tester's own, which says what Day N they've reached by now. */
	readonly timeZone: string
}

export interface DayResult {
	readonly day: number
	/** Testers who submitted a Report on this Day N. */
	readonly checkedIn: number
	/** Started testers who have reached this Day N, whether they checked in or not. */
	readonly reached: number
}

export interface Results {
	readonly signedUp: number
	readonly started: number
	readonly days: readonly DayResult[]
	readonly kept: number
	readonly partly: number
	readonly slipped: number
	readonly milestonesReached: number
}

const reportDetails = z.object({ promiseId: z.string(), answer: z.enum(REPORT_ANSWERS) })

// #34 adds this Event to the typed list, and a reached Milestone must save
// `answer: 'yes'` to be counted. Until then there are none to read.
const reachedMilestoneDetails = z.object({ answer: z.literal('yes') })

function isLater(a: ResultsEvent, b: ResultsEvent): boolean {
	const apart = a.occurredAt.getTime() - b.occurredAt.getTime()
	return apart === 0 ? a.id > b.id : apart > 0
}

/** Changing a Report adds another Event, so only a Promise's latest answer is counted. */
function countLatestReports(reports: readonly ResultsEvent[]) {
	const latest = new Map<string, { event: ResultsEvent; answer: string }>()
	for (const event of reports) {
		const { promiseId, answer } = reportDetails.parse(event.details)
		const current = latest.get(promiseId)
		if (current == null || isLater(event, current.event)) latest.set(promiseId, { event, answer })
	}
	const answers = [...latest.values()].map(({ answer }) => answer)
	const count = (answer: string) => answers.filter((each) => each === answer).length
	return { kept: count('yes'), partly: count('partly'), slipped: count('no') }
}

export function buildResults({
	events,
	now
}: {
	events: readonly ResultsEvent[]
	now: Date
}): Results {
	const named = (name: ResultsEvent['name']) => events.filter((event) => event.name === name)
	const signUps = named('signed_up')
	const reports = named('report_made')
	const signUpDays = new Map(signUps.map((event) => [event.userId, event.keptDay]))
	const startedIds = new Set(named('setup_finished').map((event) => event.userId))

	// Each started tester's furthest Day N so far. Someone who stopped keeps
	// climbing, which is what shows them as having dropped out.
	const reachedDays = signUps
		.filter((event) => startedIds.has(event.userId))
		.map((event) =>
			dayNumber({
				signUpDay: event.keptDay,
				today: toKeptDay({ instant: now, timeZone: event.timeZone })
			})
		)

	const checkedInByDay = new Map<number, Set<string>>()
	for (const { userId, keptDay } of reports) {
		const signUpDay = signUpDays.get(userId)
		if (signUpDay == null) continue
		const day = dayNumber({ signUpDay, today: keptDay })
		checkedInByDay.set(day, (checkedInByDay.get(day) ?? new Set()).add(userId))
	}

	const lastDay = Math.max(0, ...reachedDays, ...checkedInByDay.keys())
	const days: DayResult[] = []
	for (let day = FIRST_REPORT_DAY; day <= lastDay; day += 1) {
		days.push({
			day,
			checkedIn: checkedInByDay.get(day)?.size ?? 0,
			reached: reachedDays.filter((reachedDay) => reachedDay >= day).length
		})
	}

	return {
		signedUp: signUpDays.size,
		started: startedIds.size,
		days,
		...countLatestReports(reports),
		milestonesReached: named('milestone_checked').filter(
			(event) => reachedMilestoneDetails.safeParse(event.details).success
		).length
	}
}

export interface RecallResults {
	/** First and last score per Key idea, out of 2. A title could give a tester's goal away. */
	readonly ideas: readonly { readonly first: number; readonly last: number }[]
	readonly leftOut: number
}

export function buildRecallResults(progress: RecallProgress): RecallResults {
	return {
		ideas: progress.ideas
			.filter((idea) => !idea.keyIdeaId.startsWith(STUB_ID_PREFIX))
			.map(({ first, last }) => ({ first: first.score, last: last.score })),
		leftOut: progress.leftOut
	}
}
