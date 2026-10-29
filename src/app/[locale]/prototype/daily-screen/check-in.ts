'use client'

// PROTOTYPE ONLY: in-memory check-in state for the daily screen prototype.
// No persistence, no server calls; Sara's Day 2 from the walkthrough.
import { useState } from 'react'

export type Scenario = 'onTime' | 'late' | 'gap' | 'done'
export type Report = 'yes' | 'partly' | 'no'
export type Moment = 'wake up' | 'lunch' | 'after work' | 'before bed'

export type PromiseOption = {
	id: string
	action: string
	poundsPerMonth: number | null
	note?: string
}

export const SCENARIOS: { key: Scenario; label: string }[] = [
	{ key: 'onTime', label: 'Report due, on time' },
	{ key: 'late', label: 'Report due, a day late' },
	{ key: 'gap', label: 'Back after a gap' },
	{ key: 'done', label: 'Done for today' }
]

export const SARA = {
	dayN: 2,
	weekday: 'Thursday',
	monthlyTarget: 335,
	coveredBefore: 0,
	duePromise: { action: 'cook instead of ordering', moment: 'after work' as Moment }
}

export const PROMISE_OPTIONS: PromiseOption[] = [
	{ id: 'cook', action: 'Cook instead of ordering', poundsPerMonth: 156 },
	{ id: 'coffee', action: 'Make coffee at home', poundsPerMonth: 39 },
	{ id: 'subs', action: 'Cancel 2 subscriptions you don’t use', poundsPerMonth: 20 },
	{
		id: 'payday',
		action: 'On payday, move £335 to savings first',
		poundsPerMonth: null,
		note: 'Locks in the goal'
	}
]

export const MOMENTS: Moment[] = ['wake up', 'lunch', 'after work', 'before bed']

export const REPORT_LABELS: Record<Report, string> = {
	yes: 'Yes',
	partly: 'Partly',
	no: 'No'
}

type State = {
	report: Report | null
	learnDone: boolean
	pickedOption: string | null
	pickedMoment: Moment | null
	committed: boolean
}

const DONE_STATE: State = {
	report: 'yes',
	learnDone: true,
	pickedOption: 'cook',
	pickedMoment: 'after work',
	committed: true
}

const EMPTY_STATE: State = {
	report: null,
	learnDone: false,
	pickedOption: null,
	pickedMoment: null,
	committed: false
}

export type Step = 'report' | 'learn' | 'commit' | 'done'

export function useCheckIn(scenario: Scenario) {
	const [state, setState] = useState<State>(scenario === 'done' ? DONE_STATE : EMPTY_STATE)

	const hasReport = scenario !== 'gap'
	const dueWord = scenario === 'late' ? 'yesterday' : 'today'
	const commitFor = scenario === 'onTime' || scenario === 'done' ? 'tomorrow' : 'today'

	let step: Step = 'done'
	if (hasReport && state.report === null) step = 'report'
	else if (!state.learnDone) step = 'learn'
	else if (!state.committed) step = 'commit'

	const option = PROMISE_OPTIONS.find((o) => o.id === state.pickedOption) ?? null
	const covered = SARA.coveredBefore + (option?.poundsPerMonth ?? 0)

	return {
		scenario,
		state,
		step,
		hasReport,
		reportQuestion: `Did you ${SARA.duePromise.action} ${dueWord}?`,
		commitFor,
		option,
		covered,
		promiseSentence:
			option && state.pickedMoment
				? `${capitalise(state.pickedMoment)}, I will ${lowerFirst(option.action)}.`
				: null,
		setReport: (report: Report) => setState((s) => ({ ...s, report })),
		changeReport: () => setState((s) => ({ ...s, report: null })),
		finishLearn: () => setState((s) => ({ ...s, learnDone: true })),
		pickOption: (pickedOption: string) => setState((s) => ({ ...s, pickedOption })),
		pickMoment: (pickedMoment: Moment) => setState((s) => ({ ...s, pickedMoment })),
		commit: () => setState((s) => ({ ...s, committed: true }))
	}
}

export type CheckIn = ReturnType<typeof useCheckIn>

function capitalise(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1)
}

function lowerFirst(text: string) {
	return text.charAt(0).toLowerCase() + text.slice(1)
}
