import type { KeptDay } from '@/lib/kept-day'

// Which key idea to teach on a Kept day (docs/product/walkthrough.md): one a
// day, in Gemini's order, and none on a day that already brings back 2 recalls,
// so a check-in stays at 2 minutes.

export const MAX_RECALLS_PER_DAY = 2

// A taught idea first comes back the next Kept day. The returns after that
// depend on how it was answered, so the review scheduler (#32) books them.
export const FIRST_REVIEW_AFTER_DAYS = 1

export interface KeyIdeaProgress {
	readonly id: string
	readonly position: number
	readonly taughtOn: KeptDay | null
}

/** The idea to show today: the one already taught today, else the next untaught, else none. */
export function todaysKeyIdea({
	ideas,
	keptDay,
	dueRecalls
}: {
	ideas: readonly KeyIdeaProgress[]
	keptDay: KeptDay
	dueRecalls: number
}): string | null {
	const taughtToday = ideas.find((idea) => idea.taughtOn === keptDay)
	if (taughtToday != null) return taughtToday.id
	if (dueRecalls >= MAX_RECALLS_PER_DAY) return null
	const next = ideas
		.filter((idea) => idea.taughtOn == null)
		.reduce<KeyIdeaProgress | null>(
			(first, idea) => (first == null || idea.position < first.position ? idea : first),
			null
		)
	return next?.id ?? null
}
