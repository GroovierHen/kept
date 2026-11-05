import { z } from 'zod'
import { changeableReport, checkInView } from './check-in.ts'
import { keptDay, PROMISE_MOMENTS } from './common.ts'

// The Today screen: which step of the Check-in is next, the Promise it is
// about, what that step needs to show, and the week so far (GLOSSARY.md).
// Each step's write is its own route (check-in.ts).

export const CHECK_IN_STEPS = ['report', 'learn', 'commit', 'done'] as const
export const PROMISE_STATUSES = ['upcoming', 'dueToday', 'dueYesterday', 'unreported'] as const
export const DAY_OUTCOMES = [
	'kept',
	'partly',
	'slipped',
	'open',
	'unreported',
	'noPromise'
] as const

/** Kept is worth 1 and Partly half, so `kept` can end in .5, out of the Promises reported. */
export const weekKept = z.object({ kept: z.number().min(0), total: z.int().min(0) })

/** Finished Check-ins in a row it takes for a used forgiveness to come back (ADR 0004). */
export const IN_A_ROW_TO_FORGIVE_AGAIN = 3

/** The Streak, Best streak and Comebacks (GLOSSARY.md, ADR 0004), worked out on the server. */
export const streak = z.object({
	/** Kept days in the current Streak, today included once its Check-in is finished. */
	days: z.int().min(0),
	best: z.int().min(0),
	/** True while the next Empty day would be forgiven rather than end the Streak. */
	isForgivenessReady: z.boolean(),
	/** Finished Check-ins in a row since the last Empty day; at 3 forgiveness comes back. */
	inARow: z.int().min(0),
	comebacks: z.int().min(0),
	/** Today's Check-in as a Comeback: the Streak was safe, or started again. */
	comebackToday: z.enum(['safe', 'restarted']).nullable()
})

export const todayResponse = z.object({
	today: keptDay,
	/** Day 1 is the day they signed up. */
	day: z.int().min(1),
	step: z.enum(CHECK_IN_STEPS),
	/** The latest Promise; null only if setup somehow finished without one. */
	promise: z
		.object({
			wording: z.string(),
			moment: z.enum(PROMISE_MOMENTS).nullable(),
			promiseDay: keptDay,
			status: z.enum(PROMISE_STATUSES)
		})
		.nullable(),
	/** The last seven days up to today, oldest first, never before sign-up. */
	strip: z.array(z.object({ day: z.int().min(1), outcome: z.enum(DAY_OUTCOMES) })),
	week: weekKept,
	streak,
	milestone: z.object({ text: z.string(), daysLeft: z.int().min(0) }).nullable(),
	checkIn: checkInView,
	/** A Report made today on an earlier Promise, still changeable until 4am. */
	changeableReport: changeableReport.nullable(),
	/** The last Promise closed with no Report, so the screen says it counted for nothing. */
	unreported: z.boolean()
})
export type TodayResponse = z.infer<typeof todayResponse>
