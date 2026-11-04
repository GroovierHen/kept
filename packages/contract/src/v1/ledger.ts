import { z } from 'zod'
import { PROMISE_MOMENTS } from './common.ts'
import { DAY_OUTCOMES, streak, weekKept } from './today.ts'

// The Ledger (GLOSSARY.md): every Promise the person has made and what they
// said about it, how their actions changed size, and what they've learned.
// Days are day numbers (Day 1 is sign-up day), as the screen shows them.

const ACTION_SIZES = ['small', 'medium', 'large'] as const
const score = z.int().min(0).max(2)

export const ledgerResponse = z.object({
	day: z.int().min(1),
	goal: z.object({ text: z.string(), weeks: z.int().min(1) }),
	/** The day numbers of the Promises with each latest Report, oldest first. */
	promises: z.object({
		kept: z.array(z.int()),
		partly: z.array(z.int()),
		slipped: z.array(z.int())
	}),
	/** Every day from sign-up to today, oldest first, with its Promise if it had one. */
	days: z.array(
		z.object({
			day: z.int().min(1),
			outcome: z.enum(DAY_OUTCOMES),
			promise: z.object({ wording: z.string(), moment: z.enum(PROMISE_MOMENTS) }).nullable()
		})
	),
	/** Each Action's latest change of Size, newest first. */
	sizeChanges: z.array(
		z.object({
			direction: z.enum(['bigger', 'smaller']),
			wording: z.string(),
			from: z.enum(ACTION_SIZES),
			to: z.enum(ACTION_SIZES),
			day: z.int()
		})
	),
	/** First and last recall scores per key idea; ideas recalled once are only counted. */
	learned: z.object({
		ideas: z.array(
			z.object({
				keyIdeaId: z.string(),
				title: z.string(),
				first: z.object({ score, day: z.int() }),
				last: z.object({ score, day: z.int() })
			})
		),
		leftOut: z.int().min(0)
	}),
	week: weekKept,
	streak,
	milestone: z.object({ week: z.int(), text: z.string(), daysLeft: z.int().min(0) }).nullable(),
	milestones: z.array(z.object({ id: z.string(), week: z.int(), text: z.string() }))
})
export type LedgerResponse = z.infer<typeof ledgerResponse>
