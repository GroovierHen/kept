import type { ActionSize } from './learn/plan'
import type { ReportAnswer } from './report'

// The adaptive engine (GLOSSARY.md, Run and Size): what the next Promise should
// be, worked out from the user's Promises and Reports and never stored. A Promise
// keeps the Size it was made at, so a changed Report only moves what comes next.

const SIZES: readonly ActionSize[] = ['small', 'medium', 'large']
const YESES_TO_GROW = 3
const NOES_TO_SHRINK = 2

/** One Promise as it now stands, with its latest Report. null is no Report: Unreported, or not due yet. */
export interface PromiseRecord {
	readonly actionId: string | null
	readonly wording: string
	readonly size: ActionSize | null
	readonly answer: ReportAnswer | null
}

interface Run {
	readonly size: ActionSize | null
	readonly answer: ReportAnswer
	readonly length: number
}

// A Typed promise has no Action id, so its wording is what makes it the same one.
// Typing a smaller version is a switch, and starts a new Run.
const isSameAction = (first: PromiseRecord, second: PromiseRecord) =>
	first.actionId === second.actionId && (first.actionId != null || first.wording === second.wording)

/**
 * The Run that the Promise at `end` belongs to, reading back through its Action.
 * A Promise on any other Action ends it even if it went Unreported, because the
 * switch still happened. Unreported on the same Action is skipped over.
 */
function runEndingAt({
	history,
	end
}: {
	history: readonly PromiseRecord[]
	end: number
}): Run | null {
	const action = history[end]
	if (action == null) return null

	let run: Run | null = null
	for (const promise of history.slice(0, end + 1).reverse()) {
		if (!isSameAction(promise, action)) break
		if (promise.answer == null) continue
		if (run == null) {
			run = { size: promise.size, answer: promise.answer, length: 1 }
			continue
		}
		if (promise.size !== run.size || promise.answer !== run.answer) break
		run = { ...run, length: run.length + 1 }
	}
	return run
}

function moved({ size, steps }: { size: ActionSize; steps: number }): ActionSize {
	const index = Math.min(Math.max(SIZES.indexOf(size) + steps, 0), SIZES.length - 1)
	return SIZES[index] ?? size
}

/** The Size an Action's next Promise is made at, oldest Promise first in `history`. */
export function workedOutSize({
	history,
	actionId
}: {
	history: readonly PromiseRecord[]
	actionId: string
}): ActionSize {
	const end = history.findLastIndex((promise) => promise.actionId === actionId)
	const run = runEndingAt({ history, end })
	const size = run?.size ?? 'small'
	if (run?.answer === 'yes' && run.length >= YESES_TO_GROW) return moved({ size, steps: 1 })
	if (run?.answer === 'no' && run.length >= NOES_TO_SHRINK) return moved({ size, steps: -1 })
	return size
}

export type PromiseNudge =
	{ readonly kind: 'differentAction'; readonly actionId: string } | { readonly kind: 'typeSmaller' }

/**
 * What to suggest after two Noes that can't shrink: a Typed promise has no smaller
 * Size, and neither does an Action at small. The offer is the next Action in the
 * Plan's order, and a Plan with no other Action has nothing to offer.
 */
export function promiseNudge({
	history,
	planActionIds
}: {
	history: readonly PromiseRecord[]
	planActionIds: readonly string[]
}): PromiseNudge | null {
	const latest = history.at(-1)
	const run = runEndingAt({ history, end: history.length - 1 })
	if (latest == null || run?.answer !== 'no' || run.length < NOES_TO_SHRINK) return null
	if (latest.actionId == null) return { kind: 'typeSmaller' }
	if (run.size !== 'small') return null

	const next = planActionIds.indexOf(latest.actionId) + 1
	const offered = planActionIds[next % planActionIds.length]
	return offered == null || offered === latest.actionId
		? null
		: { kind: 'differentAction', actionId: offered }
}
