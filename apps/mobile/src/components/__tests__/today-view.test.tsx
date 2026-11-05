import { screen } from '@testing-library/react-native'
import type { UseQueryResult } from '@tanstack/react-query'
import type { TodayResponse } from '@kept/contract'
import { renderWithClient } from '@/test/render'
import { TodayView } from '../today-view'

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }))
jest.mock('@/lib/supabase', () => ({ signOut: jest.fn() }))
jest.mock('@/lib/api', () => ({ ...jest.requireActual('@/lib/api'), api: jest.fn() }))
jest.mock('../reminder-card', () => ({ ReminderCard: () => null }))

const TODAY: TodayResponse = {
	today: '2026-11-04',
	day: 9,
	step: 'report',
	promise: {
		wording: 'walk my dog',
		moment: 'lunch',
		promiseDay: '2026-11-03',
		status: 'dueYesterday'
	},
	strip: [
		{ day: 8, outcome: 'kept' },
		{ day: 9, outcome: 'open' }
	],
	week: { kept: 1, total: 1 },
	streak: {
		days: 0,
		best: 0,
		isForgivenessReady: true,
		inARow: 0,
		comebacks: 0,
		comebackToday: null
	},
	milestone: { text: 'Walk 20 minutes three times a week', daysLeft: 3 },
	checkIn: { step: 'report', promiseId: 'p1', when: 'yesterday' },
	changeableReport: null,
	unreported: false
}

const loaded = (data: TodayResponse) =>
	({
		data,
		isError: false,
		error: null,
		isRefetching: false
	}) as unknown as UseQueryResult<TodayResponse>

test('shows the report step, the week and the milestone', async () => {
	await renderWithClient(
		<TodayView today={loaded(TODAY)} reminderTime="20:00" onRefresh={jest.fn()} />
	)
	expect(screen.getByText('Day 9')).toBeOnTheScreen()
	expect(screen.getByRole('header', { name: 'Did you walk your dog yesterday?' })).toBeOnTheScreen()
	expect(screen.getByText('Yesterday · Lunch')).toBeOnTheScreen()
	expect(screen.getByText('1 of 1 promise kept')).toBeOnTheScreen()
	expect(screen.getByLabelText('Day 8: Kept')).toBeOnTheScreen()
	expect(screen.getByText('Due in 3 days')).toBeOnTheScreen()
})

test('a finished day shows the promise to report on next, and says when it closed unreported', async () => {
	await renderWithClient(
		<TodayView
			today={loaded({
				...TODAY,
				step: 'done',
				checkIn: { step: 'done', change: null, learned: null },
				unreported: true
			})}
			reminderTime={null}
			onRefresh={jest.fn()}
		/>
	)
	expect(screen.getByText('Done for today')).toBeOnTheScreen()
	expect(screen.getByText('walk my dog')).toBeOnTheScreen()
	expect(screen.getByText(/closed as Unreported/)).toBeOnTheScreen()
	expect(screen.queryByText('Change this promise')).toBeNull()
})

test('a Comeback after a forgiven day says the streak is safe and shows the way back to forgiveness', async () => {
	await renderWithClient(
		<TodayView
			today={loaded({
				...TODAY,
				step: 'done',
				checkIn: { step: 'done', change: null, learned: null },
				streak: {
					days: 4,
					best: 4,
					isForgivenessReady: false,
					inARow: 1,
					comebacks: 1,
					comebackToday: 'safe'
				}
			})}
			reminderTime={null}
			onRefresh={jest.fn()}
		/>
	)
	expect(screen.getByText('You’re back. Your streak is safe at 4 days.')).toBeOnTheScreen()
	expect(screen.getByLabelText('4')).toBeOnTheScreen()
	expect(screen.getByText(/Best: 4\./)).toBeOnTheScreen()
	expect(
		screen.getByText('Check in 3 days in a row and one empty day won’t end it again.')
	).toBeOnTheScreen()
	expect(screen.getByText('1 of 3 in a row')).toBeOnTheScreen()
})

test('a Streak of 0 is hidden, so a Streak that ended never shows as lost', async () => {
	await renderWithClient(
		<TodayView today={loaded(TODAY)} reminderTime={null} onRefresh={jest.fn()} />
	)
	expect(screen.queryByText('Streak')).toBeNull()
})
