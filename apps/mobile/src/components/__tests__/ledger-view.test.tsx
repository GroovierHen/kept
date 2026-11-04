import { fireEvent, render, screen } from '@testing-library/react-native'
import type { LedgerResponse } from '@kept/contract'
import { LedgerView } from '../ledger/ledger-view'

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }))

const LEDGER: LedgerResponse = {
	day: 4,
	goal: { text: 'run 5k', weeks: 8 },
	promises: { kept: [2], partly: [3], slipped: [] },
	days: [
		{ day: 1, outcome: 'noPromise', promise: null },
		{ day: 2, outcome: 'kept', promise: { wording: 'walk for 10 minutes', moment: 'lunch' } },
		{ day: 3, outcome: 'partly', promise: { wording: 'jog for 5 minutes', moment: 'after_work' } },
		{ day: 4, outcome: 'open', promise: { wording: 'jog for 5 minutes', moment: 'after_work' } }
	],
	sizeChanges: [
		{ direction: 'bigger', wording: 'jog for 5 minutes', from: 'small', to: 'medium', day: 3 }
	],
	learned: { ideas: [], leftOut: 1 },
	week: { kept: 1.5, total: 2 },
	milestone: { week: 1, text: 'Run 1 km', daysLeft: 3 },
	milestones: [
		{ id: 'm1', week: 1, text: 'Run 1 km' },
		{ id: 'm2', week: 4, text: 'Run 3 km' }
	]
}

test('shows the counts, the half-kept week, size changes and milestones', async () => {
	await render(<LedgerView ledger={LEDGER} />)
	expect(screen.getByText('Day 4 · run 5k')).toBeOnTheScreen()
	expect(screen.getByText('day 2')).toBeOnTheScreen()
	expect(screen.getByText('1.5 of 2 promises kept')).toBeOnTheScreen()
	expect(screen.getByText('small → medium on day 3')).toBeOnTheScreen()
	expect(screen.getByText(/1 more idea needs another recall/)).toBeOnTheScreen()
	expect(screen.getByText('Week 4 · Run 3 km')).toBeOnTheScreen()
	expect(screen.getByText('of 56')).toBeOnTheScreen()
})

test('today is picked first, and tapping a day shows its promise', async () => {
	await render(<LedgerView ledger={LEDGER} />)
	expect(screen.getByText('Day 4 · Not reported yet')).toBeOnTheScreen()
	await fireEvent.press(screen.getByRole('button', { name: 'Day 2: Kept' }))
	expect(screen.getByText('At lunch, I will walk for 10 minutes.')).toBeOnTheScreen()
	await fireEvent.press(screen.getByRole('button', { name: 'Day 1: No promise' }))
	expect(screen.getByText('You made no promise for this day.')).toBeOnTheScreen()
})
