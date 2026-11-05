import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import type { CheckInView, TodayResponse } from '@kept/contract'
import { api, ApiError } from '@/lib/api'
import { renderWithClient } from '@/test/render'
import { CheckIn } from '../check-in/check-in'
import { choiceOf } from '../check-in/promise-picker'

jest.mock('@/lib/supabase', () => ({ signOut: jest.fn(), isSupabaseEnabled: true }))
jest.mock('@/lib/api', () => ({ ...jest.requireActual('@/lib/api'), api: jest.fn() }))
let mockIds = 0
jest.mock('expo-crypto', () => ({ randomUUID: () => `id-${++mockIds}` }))

const mockApi = jest.mocked(api)

const BASE: Omit<TodayResponse, 'checkIn'> = {
	today: '2026-11-04',
	day: 2,
	step: 'report',
	promise: {
		wording: 'walk my dog',
		moment: 'lunch',
		promiseDay: '2026-11-04',
		status: 'dueToday'
	},
	strip: [],
	week: { kept: 0, total: 0 },
	streak: {
		days: 0,
		best: 0,
		isForgivenessReady: true,
		inARow: 0,
		comebacks: 0,
		comebackToday: null
	},
	milestone: null,
	changeableReport: null,
	unreported: false
}

const ACTIONS = [
	{ id: 'a1', wording: 'walk for 10 minutes' },
	{ id: 'a2', wording: 'put my shoes by the door' }
]

function show(checkIn: CheckInView, extra: Partial<TodayResponse> = {}) {
	return renderWithClient(<CheckIn today={{ ...BASE, ...extra, step: checkIn.step, checkIn }} />)
}

beforeEach(() => mockApi.mockReset())

describe('report', () => {
	test('one tap saves the answer, and a retry after a failure reuses the same report id', async () => {
		mockApi.mockRejectedValueOnce(new ApiError('offline', 'You’re offline.'))
		mockApi.mockResolvedValueOnce({ ok: true })
		const { invalidate } = await show({ step: 'report', promiseId: 'p1', when: 'today' })

		expect(screen.getByRole('header', { name: 'Did you walk your dog today?' })).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('radio', { name: 'Yes' }))
		expect(await screen.findByText('You’re offline.')).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('radio', { name: 'Yes' }))

		const [first, second] = mockApi.mock.calls
		expect(first).toEqual([
			'submitReport',
			{ body: { promiseId: 'p1', reportId: expect.any(String), answer: 'yes' } }
		])
		expect(second?.[1]).toEqual(first?.[1])
		await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['today'] }))
	})
})

describe('recall', () => {
	const recall = {
		keyIdeaId: 'k1',
		title: 'Run slow',
		question: 'Why run slow?',
		choices: ['To go far', 'To be fast']
	}

	test('a typed answer is marked, and Continue reads Today again', async () => {
		mockApi.mockResolvedValueOnce({
			kind: 'graded',
			score: 1,
			reason: 'Part of it.',
			modelAnswer: 'Easy runs build your base.',
			isMultipleChoice: false
		})
		const { invalidate } = await show({ step: 'learn', recall, lesson: null })

		await fireEvent.changeText(screen.getByLabelText('Your answer'), 'to last longer')
		await fireEvent.press(screen.getByRole('button', { name: 'Check my answer' }))

		expect(await screen.findByText('1 out of 2')).toBeOnTheScreen()
		expect(screen.getByText('Part of it.')).toBeOnTheScreen()
		expect(mockApi).toHaveBeenCalledWith('answerRecall', {
			body: { mode: 'typed', keyIdeaId: 'k1', answer: 'to last longer' },
			timeoutMs: 100_000
		})
		expect(invalidate).not.toHaveBeenCalled()
		await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['today'] })
	})

	test('when the AI cannot mark, the same question comes back as multiple choice', async () => {
		mockApi.mockResolvedValueOnce({ kind: 'choosing' })
		mockApi.mockResolvedValueOnce({
			kind: 'graded',
			score: 2,
			reason: '',
			modelAnswer: 'To go far',
			isMultipleChoice: true
		})
		await show({ step: 'learn', recall, lesson: null })

		await fireEvent.press(screen.getByRole('button', { name: 'Check my answer' }))
		expect(await screen.findByText(/pick the best answer/)).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('button', { name: 'Check my answer' }))
		expect(screen.getByText('Pick one answer.')).toBeOnTheScreen()

		await fireEvent.press(screen.getByRole('radio', { name: 'To go far' }))
		await fireEvent.press(screen.getByRole('button', { name: 'Check my answer' }))
		expect(await screen.findByText('Right.')).toBeOnTheScreen()
		expect(mockApi).toHaveBeenLastCalledWith('answerRecall', {
			body: { mode: 'choice', keyIdeaId: 'k1', choice: 0 },
			timeoutMs: 100_000
		})
	})
})

test('the lesson counts as learned on Continue', async () => {
	mockApi.mockResolvedValueOnce({ ok: true })
	await show({
		step: 'learn',
		recall: null,
		lesson: { keyIdeaId: 'k2', title: 'Add 10% a week', lesson: 'Build slowly.' }
	})
	expect(screen.getByRole('header', { name: 'Add 10% a week' })).toBeOnTheScreen()
	await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
	expect(mockApi).toHaveBeenCalledWith('finishLesson', { body: { keyIdeaId: 'k2' } })
})

describe('commit', () => {
	test('the current promise comes picked, so keeping it is one tap', async () => {
		mockApi.mockResolvedValueOnce({ ok: true })
		await show({
			step: 'commit',
			picker: { actions: ACTIONS, initial: { moment: 'after_work', actionId: 'a2', typed: null } },
			nudge: null,
			hasCurrent: true
		})
		expect(screen.getByText('After work, I will put my shoes by the door.')).toBeOnTheScreen()
		expect(screen.getByText(/already picked/)).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('button', { name: 'Make my promise' }))
		expect(mockApi).toHaveBeenCalledWith('commitPromise', {
			body: { kind: 'action', moment: 'after_work', actionId: 'a2' }
		})
	})

	test('a nudge leads the step, and no moment picked is said, not sent', async () => {
		await show({
			step: 'commit',
			picker: { actions: ACTIONS, initial: null },
			nudge: 'typeSmaller',
			hasCurrent: true
		})
		expect(screen.getByText(/Try typing a smaller version/)).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('button', { name: 'Make my promise' }))
		expect(screen.getByText(/Pick a moment/)).toBeOnTheScreen()
		expect(mockApi).not.toHaveBeenCalled()
	})
})

test('done: today’s promise can change to typed words until 4am', async () => {
	mockApi.mockResolvedValueOnce({ ok: true })
	await show({
		step: 'done',
		change: {
			promiseId: 'p2',
			actions: ACTIONS,
			initial: { moment: 'lunch', actionId: 'a1', typed: null }
		},
		learned: { keyIdeaId: 'k1', title: 'Run slow', lesson: 'Slow is fine.' }
	})
	expect(screen.getByText('Learned today')).toBeOnTheScreen()
	await fireEvent.press(screen.getByRole('button', { name: 'Change this promise' }))
	await fireEvent.press(screen.getByRole('button', { name: 'Type my own' }))
	await fireEvent.changeText(screen.getByLabelText('Your own promise'), ' stretch ')
	await fireEvent.press(screen.getByRole('button', { name: 'Change my promise' }))
	expect(mockApi).toHaveBeenCalledWith('changePromise', {
		body: {
			promiseId: 'p2',
			changeId: expect.any(String),
			choice: { kind: 'typed', moment: 'lunch', wording: 'stretch' }
		}
	})
})

test('a report made today can be changed', async () => {
	mockApi.mockResolvedValueOnce({ ok: true })
	await show(
		{ step: 'done', change: null, learned: null },
		{
			changeableReport: {
				promiseId: 'p1',
				promiseDay: '2026-11-04',
				wording: 'walk my dog',
				answer: 'yes',
				when: 'today'
			}
		}
	)
	await fireEvent.press(screen.getByRole('button', { name: 'You answered Yes. Change my answer' }))
	await fireEvent.press(screen.getByRole('radio', { name: 'Partly' }))
	expect(mockApi).toHaveBeenCalledWith('submitReport', {
		body: { promiseId: 'p1', reportId: expect.any(String), answer: 'partly' }
	})
})

test('a choice is what the server would accept, or nothing', () => {
	expect(choiceOf({ isTyping: false, typed: '', actionId: 'a1', moment: null })).toBeNull()
	expect(choiceOf({ isTyping: true, typed: '   ', actionId: 'a1', moment: 'lunch' })).toBeNull()
	expect(
		choiceOf({ isTyping: true, typed: 'x'.repeat(161), actionId: null, moment: 'lunch' })
	).toBeNull()
	expect(choiceOf({ isTyping: true, typed: ' run ', actionId: 'a1', moment: 'lunch' })).toEqual({
		kind: 'typed',
		moment: 'lunch',
		wording: 'run'
	})
})
