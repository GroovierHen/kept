import { z } from 'zod'

// What the promise step sends: one of the plan's actions, or a Typed promise,
// and when in the day (GLOSSARY.md).

export const PROMISE_MOMENTS = ['wake_up', 'lunch', 'after_work', 'before_bed'] as const
export type PromiseMoment = (typeof PROMISE_MOMENTS)[number]

// The same limit as an action's wording (src/lib/learn/plan.ts).
export const MAX_PROMISE_LENGTH = 160

const moment = z.enum(PROMISE_MOMENTS)

export const promiseChoice = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('action'), moment, actionId: z.uuid() }),
	z.object({
		kind: z.literal('typed'),
		moment,
		wording: z.string().trim().min(1).max(MAX_PROMISE_LENGTH)
	})
])

export type PromiseChoice = z.infer<typeof promiseChoice>
