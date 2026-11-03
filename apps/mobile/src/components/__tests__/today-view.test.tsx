import { render, screen } from '@testing-library/react-native'
import type { UseQueryResult } from '@tanstack/react-query'
import type { TodayResponse } from '@kept/contract'
import { TodayView } from '../today-view'

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }))
jest.mock('@/lib/supabase', () => ({ signOut: jest.fn() }))
jest.mock('@/lib/env', () => ({ env: { EXPO_PUBLIC_SITE_URL: 'https://kept.test' } }))
jest.mock('../reminder-card', () => ({ ReminderCard: () => null }))

const TODAY: TodayResponse = {
	today: '2026-11-04',
	day: 9,
	step: 'report',
	promise: {
		wording: 'walk for 10 minutes',
		moment: 'lunch',
		promiseDay: '2026-11-03',
		status: 'dueYesterday'
	},
	strip: [
		{ day: 8, outcome: 'kept' },
		{ day: 9, outcome: 'open' }
	],
	week: { kept: 1, total: 1 },
	milestone: { text: 'Walk 20 minutes three times a week', daysLeft: 3 }
}

const loaded = (data: TodayResponse) =>
	({
		data,
		isError: false,
		error: null,
		isRefetching: false
	}) as unknown as UseQueryResult<TodayResponse>

test('shows the step, the promise, the week and the milestone', async () => {
	await render(<TodayView today={loaded(TODAY)} reminderTime="20:00" onRefresh={jest.fn()} />)
	expect(screen.getByText('Day 9')).toBeOnTheScreen()
	expect(screen.getByText('Report back')).toBeOnTheScreen()
	expect(screen.getByText('Yesterday’s promise')).toBeOnTheScreen()
	expect(screen.getByText('walk for 10 minutes')).toBeOnTheScreen()
	expect(screen.getByText('Lunch')).toBeOnTheScreen()
	expect(screen.getByText('1 of 1 promise kept')).toBeOnTheScreen()
	expect(screen.getByLabelText('Day 8: Kept')).toBeOnTheScreen()
	expect(screen.getByText('Due in 3 days')).toBeOnTheScreen()
	expect(screen.getByText('Check in on the web')).toBeOnTheScreen()
})

test('a finished day offers no step to open', async () => {
	await render(
		<TodayView
			today={loaded({ ...TODAY, step: 'done' })}
			reminderTime={null}
			onRefresh={jest.fn()}
		/>
	)
	expect(screen.getByText('Done for today')).toBeOnTheScreen()
	expect(screen.queryByText('Check in on the web')).toBeNull()
})
