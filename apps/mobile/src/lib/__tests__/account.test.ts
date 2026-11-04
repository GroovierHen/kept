import type { MeResponse } from '@kept/contract'
import { forgetAccount, readMe } from '../account'
import { api } from '../api'
import { credentialProblem } from '../credentials'

jest.mock('../api', () => ({ api: jest.fn() }))
jest.mock('expo-localization', () => ({ getCalendars: () => [{ timeZone: 'Asia/Karachi' }] }))

const mockApi = jest.mocked(api)
const ME: MeResponse = {
	user: { id: '6f1c1f4e-8a3b-4d55-9b1e-2f0d3c9a7b10', email: 'a@example.com' },
	setupStep: 'goal',
	reminderTime: null
}

beforeEach(() => {
	mockApi.mockReset()
	mockApi.mockResolvedValue(ME)
	forgetAccount()
})

test('the first read after sign-in saves the account with the phone’s time zone, then reads', async () => {
	await readMe()
	await readMe()
	expect(mockApi).toHaveBeenNthCalledWith(1, 'provisionMe', {
		body: { timeZone: 'Asia/Karachi' },
		signal: undefined
	})
	expect(mockApi).toHaveBeenNthCalledWith(2, 'getMe', { signal: undefined })
})

test('a failed save is tried again on the next read, and sign-out starts over', async () => {
	mockApi.mockRejectedValueOnce(new Error('offline'))
	await expect(readMe()).rejects.toThrow('offline')
	await readMe()
	expect(mockApi).toHaveBeenLastCalledWith('provisionMe', expect.anything())

	forgetAccount()
	await readMe()
	expect(mockApi).toHaveBeenLastCalledWith('provisionMe', expect.anything())
})

test('sign-up says what it can before sending anything', () => {
	expect(credentialProblem('not-an-email', 'a-good-password')).toBe('email')
	expect(credentialProblem('a@example.com', 'short')).toBe('password')
	expect(credentialProblem('a@example.com', 'x'.repeat(73))).toBe('passwordLong')
	expect(credentialProblem('a@example.com', 'a-good-password')).toBeNull()
})
