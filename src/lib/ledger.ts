import { addDays, dayNumber, type KeptDay } from './kept-day'
import type { ActionSize } from './learn/plan'
import type { ReportAnswer } from './report'

// The user's ledger (docs/product/walkthrough.md, "Day 5: the ledger"), worked out
// from Events and the Kept day it's given, never stored (ADR 0001).

const WEEK_DAYS = 7
const PARTLY_VALUE = 0.5
const SIZES: readonly ActionSize[] = ['small', 'medium', 'large']

export type LedgerEvent =
	| {
			readonly name: 'promise_committed'
			readonly details: {
				readonly promiseId: string
				readonly promiseDay: KeptDay
				readonly actionId: string | null
				readonly size: ActionSize | null
			}
	  }
	| {
			readonly name: 'report_made'
			readonly details: {
				readonly promiseId: string
				readonly promiseDay: KeptDay
				readonly answer: ReportAnswer
			}
	  }

export interface SizeChange {
	readonly actionId: string
	readonly from: ActionSize
	readonly to: ActionSize
	readonly direction: 'bigger' | 'smaller'
	readonly promiseDay: KeptDay
}

export interface Ledger {
	/** The Kept days of the Promises with each latest Report, oldest first. */
	readonly kept: readonly KeptDay[]
	readonly partly: readonly KeptDay[]
	readonly slipped: readonly KeptDay[]
	/** Each Action's latest change of Size, newest first. */
	readonly sizeChanges: readonly SizeChange[]
	/** Kept is worth 1 and Partly half, out of the Promises reported in the Week. */
	readonly week: { readonly kept: number; readonly total: number }
}

/** A changed Report is a new Event, so the last one for each Promise counts. */
function latestReports(events: readonly LedgerEvent[]) {
	const reports = new Map<string, { promiseDay: KeptDay; answer: ReportAnswer }>()
	for (const { name, details } of events) {
		if (name === 'report_made') reports.set(details.promiseId, details)
	}
	return [...reports.values()].toSorted((a, b) => a.promiseDay.localeCompare(b.promiseDay))
}

function sizeChanges(events: readonly LedgerEvent[]): SizeChange[] {
	// A user has one Promise a Kept day, so a Promise changed before 4am replaces that
	// day's earlier commit rather than counting as a change of Size.
	const committedByDay = new Map<KeptDay, { actionId: string; size: ActionSize } | null>()
	for (const { name, details } of events) {
		if (name !== 'promise_committed') continue
		const { promiseDay, actionId, size } = details
		committedByDay.set(promiseDay, actionId == null || size == null ? null : { actionId, size })
	}

	const days = [...committedByDay.keys()].toSorted()
	const sizeOfAction = new Map<string, ActionSize>()
	const latestChange = new Map<string, SizeChange>()
	for (const promiseDay of days) {
		const committed = committedByDay.get(promiseDay)
		if (committed == null) continue
		const { actionId, size: to } = committed
		const from = sizeOfAction.get(actionId)
		sizeOfAction.set(actionId, to)
		if (from == null || from === to) continue
		const direction = SIZES.indexOf(to) > SIZES.indexOf(from) ? 'bigger' : 'smaller'
		latestChange.set(actionId, { actionId, from, to, direction, promiseDay })
	}
	return [...latestChange.values()].toSorted((a, b) => b.promiseDay.localeCompare(a.promiseDay))
}

const reportValue = { yes: 1, partly: PARTLY_VALUE, no: 0 } satisfies Record<ReportAnswer, number>

/**
 * `events` run oldest first. A Promise with no Report isn't counted at all, so an
 * Unreported one is neither kept nor slipped and doesn't lower the Week.
 */
export function buildLedger({
	events,
	today
}: {
	events: readonly LedgerEvent[]
	today: KeptDay
}): Ledger {
	const reports = latestReports(events)
	const daysAnswered = (answer: ReportAnswer) =>
		reports.filter((report) => report.answer === answer).map((report) => report.promiseDay)
	const weekStart = addDays({ day: today, days: 1 - WEEK_DAYS })
	const reportsThisWeek = reports.filter(
		({ promiseDay }) => promiseDay >= weekStart && promiseDay <= today
	)

	return {
		kept: daysAnswered('yes'),
		partly: daysAnswered('partly'),
		slipped: daysAnswered('no'),
		sizeChanges: sizeChanges(events),
		week: {
			kept: reportsThisWeek.reduce((sum, { answer }) => sum + reportValue[answer], 0),
			total: reportsThisWeek.length
		}
	}
}

/**
 * The first Milestone still to come. A Milestone for week N is due on Day 7N, so
 * week 2 is 9 days away on Day 5.
 */
export function nextMilestone<Milestone extends { readonly week: number }>({
	milestones,
	signUpDay,
	today
}: {
	milestones: readonly Milestone[]
	signUpDay: KeptDay
	today: KeptDay
}): (Milestone & { readonly daysLeft: number }) | null {
	const currentDay = dayNumber({ signUpDay, today })
	const [next] = milestones
		.filter(({ week }) => week * WEEK_DAYS >= currentDay)
		.toSorted((a, b) => a.week - b.week)
	return next == null ? null : { ...next, daysLeft: next.week * WEEK_DAYS - currentDay }
}
