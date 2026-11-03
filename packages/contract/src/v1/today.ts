import { z } from 'zod'
import { keptDay } from './common.ts'

// The Today screen, read-only: which step of the Check-in is next, the
// Promise it is about, and the week so far (GLOSSARY.md). The steps
// themselves (report, learn, commit) are separate routes.

export const CHECK_IN_STEPS = ['report', 'learn', 'commit', 'done'] as const
export const PROMISE_MOMENTS = ['wake_up', 'lunch', 'after_work', 'before_bed'] as const
export const PROMISE_STATUSES = ['upcoming', 'dueToday', 'dueYesterday', 'unreported'] as const
export const DAY_OUTCOMES = [
	'kept',
	'partly',
	'slipped',
	'open',
	'unreported',
	'noPromise'
] as const

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
	week: z.object({ kept: z.int().min(0), total: z.int().min(0) }),
	milestone: z.object({ text: z.string(), daysLeft: z.int().min(0) }).nullable()
})
export type TodayResponse = z.infer<typeof todayResponse>
