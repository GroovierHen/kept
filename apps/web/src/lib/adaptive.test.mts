import assert from 'node:assert/strict'
import { test } from 'node:test'
import { promiseNudge, workedOutSize, type PromiseRecord } from './adaptive.ts'

const RUN = 'run'
const STRETCH = 'stretch'
const PLAN = [RUN, STRETCH, 'sleep']

type Answer = PromiseRecord['answer']

/**
 * The Act loop: each day commits a Promise at the Size the engine works out, as
 * the server does, then reports on it. A bare answer stays on the Action before
 * it, and a null answer is a Promise that closed Unreported.
 */
function walk(steps: readonly (Answer | { action?: string; typed?: string; answer: Answer })[]) {
	const history: PromiseRecord[] = []
	let actionId: string | null = RUN
	let wording = ''
	for (const step of steps) {
		const { action, typed, answer } =
			step != null && typeof step === 'object'
				? step
				: { action: undefined, typed: undefined, answer: step }
		if (action != null) actionId = action
		if (typed != null) {
			actionId = null
			wording = typed
		}
		history.push({
			actionId,
			wording,
			size: actionId == null ? null : workedOutSize({ history, actionId }),
			answer
		})
	}
	return history
}

const sizeOfRun = (...steps: Parameters<typeof walk>[0]) =>
	workedOutSize({ history: walk(steps), actionId: RUN })

const nudgeAfter = (...steps: Parameters<typeof walk>[0]) =>
	promiseNudge({ history: walk(steps), planActionIds: PLAN })

test('every Action starts at small', () => {
	assert.equal(workedOutSize({ history: [], actionId: RUN }), 'small')
	assert.equal(sizeOfRun('yes'), 'small')
	assert.equal(workedOutSize({ history: walk(['yes', 'yes', 'yes']), actionId: STRETCH }), 'small')
})

test('Yes on days 2, 3 and 4 moves the Promise for day 5 from small to medium', () => {
	const history = walk(['yes', 'yes', 'yes', null])
	assert.deepEqual(
		history.map(({ size }) => size),
		['small', 'small', 'small', 'medium']
	)
})

test('two Yeses change nothing, and neither does a third Yes split by a No', () => {
	assert.equal(sizeOfRun('yes', 'yes'), 'small')
	assert.equal(sizeOfRun('yes', 'yes', 'no', 'yes'), 'small')
})

test('a Run starts again after a change of Size', () => {
	const grown = ['yes', 'yes', 'yes'] as const
	assert.equal(sizeOfRun(...grown), 'medium')
	assert.equal(sizeOfRun(...grown, 'yes'), 'medium')
	assert.equal(sizeOfRun(...grown, 'yes', 'yes'), 'medium')
	assert.equal(sizeOfRun(...grown, 'yes', 'yes', 'yes'), 'large')
})

test('two Noes in a row move an Action down a Size', () => {
	const medium = ['yes', 'yes', 'yes'] as const
	assert.equal(sizeOfRun(...medium, 'no'), 'medium')
	assert.equal(sizeOfRun(...medium, 'no', 'no'), 'small')
})

test('at large it stays large, and two Noes bring it down', () => {
	const large = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'] as const
	assert.equal(sizeOfRun(...large), 'large')
	assert.equal(sizeOfRun(...large, 'yes', 'yes', 'yes'), 'large')
	assert.equal(sizeOfRun(...large, 'no', 'no'), 'medium')
})

test('at small, two more Noes keep it small and offer a different Action', () => {
	const shrunk = ['yes', 'yes', 'yes', 'no', 'no'] as const
	assert.equal(sizeOfRun(...shrunk), 'small')
	assert.equal(nudgeAfter(...shrunk), null, 'moving down a Size is the answer to these two')
	assert.equal(nudgeAfter(...shrunk, 'no'), null)

	assert.equal(sizeOfRun(...shrunk, 'no', 'no'), 'small')
	assert.deepEqual(nudgeAfter(...shrunk, 'no', 'no'), {
		kind: 'differentAction',
		actionId: STRETCH
	})
})

test('the first two Noes at small also offer a different Action, until a Yes', () => {
	assert.deepEqual(nudgeAfter('no', 'no'), { kind: 'differentAction', actionId: STRETCH })
	assert.deepEqual(nudgeAfter('no', 'no', 'no'), { kind: 'differentAction', actionId: STRETCH })
	assert.equal(nudgeAfter('no', 'no', 'yes'), null)
})

test('the offer is the next Action in the Plan, wrapping round, and needs another Action', () => {
	assert.deepEqual(promiseNudge({ history: walk(['no', 'no']), planActionIds: [STRETCH, RUN] }), {
		kind: 'differentAction',
		actionId: STRETCH
	})
	assert.equal(promiseNudge({ history: walk(['no', 'no']), planActionIds: [RUN] }), null)
})

test('nothing is offered at medium, or once the user has already switched', () => {
	assert.equal(nudgeAfter('yes', 'yes', 'yes', 'no', 'no'), null)
	assert.equal(nudgeAfter('no', 'no', { action: STRETCH, answer: null }), null)
	assert.equal(nudgeAfter('no', 'no', { action: STRETCH, answer: 'yes' }), null)
})

test('a Partly holds steady and ends a Run, so No, Partly, No does not shrink', () => {
	const medium = ['yes', 'yes', 'yes'] as const
	assert.equal(sizeOfRun(...medium, 'no', 'partly', 'no'), 'medium')
	assert.equal(sizeOfRun(...medium, 'partly'), 'medium')
	assert.equal(sizeOfRun('yes', 'partly', 'yes', 'yes'), 'small')
	assert.equal(sizeOfRun('yes', 'yes', 'partly', 'yes'), 'small')
})

test('Unreported is skipped, so No, Unreported, No shrinks', () => {
	const medium = ['yes', 'yes', 'yes'] as const
	assert.equal(sizeOfRun(...medium, 'no', null, 'no'), 'small')
	assert.equal(sizeOfRun('yes', null, 'yes', null, null, 'yes'), 'medium')
	assert.deepEqual(nudgeAfter('no', null, 'no'), { kind: 'differentAction', actionId: STRETCH })
	assert.deepEqual(nudgeAfter('no', 'no', null), { kind: 'differentAction', actionId: STRETCH })
})

test('an Unreported at a new Size keeps what the Reports earned', () => {
	assert.equal(sizeOfRun('yes', 'yes', 'yes', null), 'medium')
	assert.equal(sizeOfRun('yes', 'yes', 'yes', null, 'yes'), 'medium')
})

test('switching Action starts a new Run, even if the other Promise went Unreported', () => {
	const away = { action: STRETCH, answer: 'yes' } as const
	const back = { action: RUN, answer: 'yes' } as const
	assert.equal(sizeOfRun('yes', 'yes', away, back), 'small')
	assert.equal(sizeOfRun('yes', 'yes', { action: STRETCH, answer: null }, back), 'small')
	assert.equal(
		sizeOfRun('no', { action: STRETCH, answer: null }, { action: RUN, answer: 'no' }),
		'small'
	)
	assert.equal(
		nudgeAfter('no', { action: STRETCH, answer: null }, { action: RUN, answer: 'no' }),
		null
	)
})

test('returning to an Action picks up its Size', () => {
	const away = { action: STRETCH, answer: 'yes' } as const
	assert.equal(sizeOfRun('yes', 'yes', 'yes', away, away), 'medium')
	const history = walk(['yes', 'yes', 'yes', away, { action: RUN, answer: 'no' }])
	assert.equal(history.at(-1)?.size, 'medium')
	assert.equal(workedOutSize({ history, actionId: RUN }), 'medium')
	assert.equal(workedOutSize({ history, actionId: STRETCH }), 'small')
})

test('Sizes grow for each Action on its own', () => {
	const stretch = { action: STRETCH, answer: 'yes' } as const
	const history = walk(['yes', 'yes', 'yes', stretch, stretch, stretch])
	assert.equal(workedOutSize({ history, actionId: RUN }), 'medium')
	assert.equal(workedOutSize({ history, actionId: STRETCH }), 'medium')
})

test('two Noes on a Typed promise ask for a smaller one, and three Yeses change nothing', () => {
	const typed = { typed: 'walk for 10 minutes', answer: 'no' } as const
	assert.deepEqual(nudgeAfter(typed, typed), { kind: 'typeSmaller' })
	assert.deepEqual(nudgeAfter(typed, typed, typed), { kind: 'typeSmaller' })
	assert.deepEqual(nudgeAfter(typed, null, typed), { kind: 'typeSmaller' })
	assert.equal(nudgeAfter(typed, { typed: 'walk for 10 minutes', answer: 'partly' }, typed), null)

	const yes = { typed: 'walk for 10 minutes', answer: 'yes' } as const
	assert.equal(nudgeAfter(yes, yes, yes), null)
	const history = walk([yes, yes, yes])
	assert.deepEqual(
		history.map(({ size }) => size),
		[null, null, null]
	)
	assert.equal(workedOutSize({ history, actionId: RUN }), 'small')
})

test('typing a smaller version starts a new Run', () => {
	const bigger = { typed: 'walk for 10 minutes', answer: 'no' } as const
	const smaller = { typed: 'walk for 5 minutes', answer: 'no' } as const
	assert.equal(nudgeAfter(bigger, bigger, smaller), null)
	assert.deepEqual(nudgeAfter(bigger, bigger, smaller, smaller), { kind: 'typeSmaller' })
})

test('a Typed promise between two Promises on an Action ends its Run but not its Size', () => {
	const typed = { typed: 'walk home', answer: 'yes' } as const
	assert.equal(sizeOfRun('yes', 'yes', typed, { action: RUN, answer: 'yes' }), 'small')
	assert.equal(sizeOfRun('yes', 'yes', 'yes', typed), 'medium')
})

const changed = (history: readonly PromiseRecord[], index: number, answer: Answer) =>
	history.map((promise, at) => (at === index ? { ...promise, answer } : promise))

test('a changed Report affects Runs from the next commit, and leaves a committed Promise alone', () => {
	// The third Yes committed a medium Promise for day 5, then became a No.
	const committed = walk(['yes', 'yes', 'yes', null])
	const corrected = changed(committed, 2, 'no')
	assert.equal(corrected.at(-1)?.size, 'medium', 'a Promise keeps the Size it was made at')
	assert.equal(workedOutSize({ history: corrected, actionId: RUN }), 'small')

	// That Promise, once reported, is what the next one follows.
	assert.equal(workedOutSize({ history: changed(corrected, 3, 'yes'), actionId: RUN }), 'medium')
})

test('a Report changed to Yes joins the Run, however many Promises it has been waiting behind', () => {
	const history = walk(['yes', 'yes', 'no', 'yes'])
	assert.equal(workedOutSize({ history, actionId: RUN }), 'small')
	assert.deepEqual(
		history.map(({ size }) => size),
		['small', 'small', 'small', 'small']
	)
	assert.equal(workedOutSize({ history: changed(history, 2, 'yes'), actionId: RUN }), 'medium')
})

test('a Report changed away from No withdraws the shrink and the offer', () => {
	const history = walk(['yes', 'yes', 'yes', 'no', 'no'])
	assert.equal(workedOutSize({ history, actionId: RUN }), 'small')
	assert.equal(workedOutSize({ history: changed(history, 4, 'partly'), actionId: RUN }), 'medium')

	const offered = walk(['no', 'no'])
	assert.deepEqual(promiseNudge({ history: offered, planActionIds: PLAN }), {
		kind: 'differentAction',
		actionId: STRETCH
	})
	assert.equal(promiseNudge({ history: changed(offered, 1, 'yes'), planActionIds: PLAN }), null)
})
