import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import type { SetupView } from '@kept/contract'
import { api } from '@/lib/api'
import { askForReminders, scheduleDailyReminder } from '@/lib/reminders'
import { renderWithClient } from '@/test/render'
import { GoalStep } from '../setup/goal-step'
import { PlanStep } from '../setup/plan-step'
import { ReminderStep, reminderTimeOf } from '../setup/first-steps'

jest.mock('@/lib/supabase', () => ({ signOut: jest.fn(), isSupabaseEnabled: true }))
jest.mock('@/lib/api', () => ({ ...jest.requireActual('@/lib/api'), api: jest.fn() }))
jest.mock('@/lib/observability', () => ({ captureError: jest.fn() }))
jest.mock('@/lib/reminders', () => ({
	askForReminders: jest.fn(),
	scheduleDailyReminder: jest.fn()
}))
jest.mock('@react-native-community/datetimepicker', () => () => null)

const mockApi = jest.mocked(api)
const EMPTY = { text: null, weeks: null, startingPoint: null, obstacle: null }

beforeEach(() => {
	jest.clearAllMocks()
	mockApi.mockReset()
})

describe('goal', () => {
	test('an example fills the answer, and Continue saves it trimmed', async () => {
		mockApi.mockResolvedValueOnce({ ok: true })
		const { invalidate } = await renderWithClient(
			<GoalStep view={{ step: 'goal', question: 'obstacle', answers: EMPTY }} eyebrow="Step 1" />
		)
		expect(screen.getByRole('header', { name: 'What usually gets in your way?' })).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('button', { name: 'I forget' }))
		await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
		expect(mockApi).toHaveBeenCalledWith('saveGoalAnswer', {
			body: { question: 'obstacle', answer: 'I forget' }
		})
		await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['setup'] }))
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me'] })
	})

	test('an empty answer is said, not sent', async () => {
		await renderWithClient(
			<GoalStep view={{ step: 'goal', question: 'text', answers: EMPTY }} eyebrow="Step 1" />
		)
		await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
		expect(screen.getByText('Write a few words so we can plan around it.')).toBeOnTheScreen()
		expect(mockApi).not.toHaveBeenCalled()
	})

	test('the length is one of the plan lengths, sent as a number', async () => {
		mockApi.mockResolvedValueOnce({ ok: true })
		await renderWithClient(
			<GoalStep
				view={{ step: 'goal', question: 'weeks', answers: { ...EMPTY, text: 'run' } }}
				eyebrow="Step 1"
			/>
		)
		await fireEvent.press(screen.getByRole('radio', { name: '8 weeks' }))
		await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
		expect(mockApi).toHaveBeenCalledWith('saveGoalAnswer', {
			body: { question: 'weeks', answer: 8 }
		})
	})
})

describe('plan', () => {
	const goalSaved: Extract<SetupView, { step: 'plan' }>['plan'] = {
		status: 'goal_saved',
		goalText: 'Run 5k',
		isBuilding: false
	}

	test('an unsafe goal comes back with a safer wording, which saves and builds again', async () => {
		mockApi
			.mockResolvedValueOnce({ kind: 'unsafe', saferGoal: 'Walk 5k' })
			.mockResolvedValueOnce({ ok: true })
			.mockResolvedValueOnce({ kind: 'saved' })
		await renderWithClient(<PlanStep plan={goalSaved} eyebrow="Step 2" />)

		await fireEvent.press(screen.getByRole('button', { name: 'Make my plan' }))
		expect(mockApi).toHaveBeenCalledWith('buildPlan', { timeoutMs: 200_000 })
		expect(await screen.findByText(/can’t plan that goal safely/)).toBeOnTheScreen()
		expect(screen.getByDisplayValue('Walk 5k')).toBeOnTheScreen()

		await fireEvent.press(screen.getByRole('button', { name: 'Use this goal' }))
		await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(3))
		expect(mockApi).toHaveBeenNthCalledWith(2, 'saveGoalAnswer', {
			body: { question: 'text', answer: 'Walk 5k' }
		})
		expect(mockApi).toHaveBeenNthCalledWith(3, 'buildPlan', { timeoutMs: 200_000 })
	})

	test('a build running elsewhere shows the wait, with no button to start another', async () => {
		await renderWithClient(<PlanStep plan={{ ...goalSaved, isBuilding: true }} eyebrow="Step 2" />)
		expect(screen.getByText('Writing your plan…')).toBeOnTheScreen()
		expect(screen.queryByRole('button', { name: 'Make my plan' })).toBeNull()
	})

	test('the made plan can be reworded, keeps its last action, and is confirmed', async () => {
		mockApi.mockResolvedValueOnce({ result: 'last_action' }).mockResolvedValueOnce({ ok: true })
		await renderWithClient(
			<PlanStep
				plan={{
					status: 'plan_made',
					draft: {
						goal: { text: 'Run 5k', weeks: 8 },
						milestones: [{ id: 'm1', week: 4, text: 'Run 2k' }],
						actions: [{ id: 'a1', small: 'walk 5 min', medium: 'jog 5 min', large: 'jog 10 min' }],
						keyIdeaCount: 5,
						canRebuild: false
					}
				}}
				eyebrow="Step 2"
			/>
		)
		expect(screen.getByText('Week 4')).toBeOnTheScreen()
		expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()

		await fireEvent.press(screen.getByRole('button', { name: 'Edit' }))
		await fireEvent.press(screen.getByRole('button', { name: 'Remove this action' }))
		expect(await screen.findByText(/needs at least one action/)).toBeOnTheScreen()

		await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }))
		await fireEvent.press(screen.getByRole('button', { name: 'Confirm my plan' }))
		expect(mockApi).toHaveBeenLastCalledWith('confirmPlan')
	})
})

describe('reminder', () => {
	test('asks for notifications, schedules the reminder, then saves the time', async () => {
		jest.mocked(askForReminders).mockResolvedValueOnce('granted')
		mockApi.mockResolvedValueOnce({ ok: true })
		await renderWithClient(<ReminderStep eyebrow="Step 5" />)

		await fireEvent.press(screen.getByRole('button', { name: 'Turn on my daily reminder' }))
		await waitFor(() =>
			expect(mockApi).toHaveBeenCalledWith('saveReminder', { body: { time: '20:00' } })
		)
		expect(scheduleDailyReminder).toHaveBeenCalledWith('20:00')
	})

	test('a “no” to notifications still saves the time and finishes setup', async () => {
		jest.mocked(askForReminders).mockResolvedValueOnce('denied')
		mockApi.mockResolvedValueOnce({ ok: true })
		await renderWithClient(<ReminderStep eyebrow="Step 5" />)

		await fireEvent.press(screen.getByRole('button', { name: 'Turn on my daily reminder' }))
		await waitFor(() => expect(mockApi).toHaveBeenCalledWith('saveReminder', expect.anything()))
		expect(scheduleDailyReminder).not.toHaveBeenCalled()
	})

	test('a picked time is saved as HH:MM', () => {
		const date = new Date(2026, 10, 4, 7, 5)
		expect(reminderTimeOf(date)).toBe('07:05')
	})
})
