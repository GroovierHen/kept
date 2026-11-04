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
	milestone: z.object({ text: z.string(), daysLeft: z.int().min(0) }).nullable(),
	checkIn: checkInView,
	/** A Report made today on an earlier Promise, still changeable until 4am. */
	changeableReport: changeableReport.nullable(),
	/** The last Promise closed with no Report, so the screen says it counted for nothing. */
	unreported: z.boolean()
})
export type TodayResponse = z.infer<typeof todayResponse>
