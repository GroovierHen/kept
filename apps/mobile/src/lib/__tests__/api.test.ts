import NetInfo from '@react-native-community/netinfo'
import type { MeResponse } from '@kept/contract'
import * as supabase from '../supabase'
import { api, ApiError, shouldRetry } from '../api'

// jest.mock calls are hoisted above the imports, so these replace the real modules.

jest.mock('../env', () => ({
	env: {
		EXPO_PUBLIC_SITE_URL: 'https://kept.test',
		EXPO_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com'
	},
	invalidEnvNames: []
}))
jest.mock('../supabase', () => ({
	isSupabaseEnabled: true,
	currentAccessToken: jest.fn(),
	refreshedAccessToken: jest.fn(),
	signOut: jest.fn()
}))
jest.mock('@react-native-community/netinfo', () => ({
	fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true }))
}))

const ME: MeResponse = {
	user: { id: '6f1c1f4e-8a3b-4d55-9b1e-2f0d3c9a7b10', email: 'a@example.com' },
	setupStep: null,
	reminderTime: '20:00'
}

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>()
globalThis.fetch = fetchMock as unknown as typeof fetch

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
	fetchMock.mockReset()
	jest.mocked(supabase.currentAccessToken).mockResolvedValue({ token: 'first' })
	jest.mocked(supabase.refreshedAccessToken).mockResolvedValue({ token: 'second' })
	jest.mocked(supabase.signOut).mockReset()
})

test('sends the bearer token and returns the parsed response', async () => {
	fetchMock.mockResolvedValueOnce(json(ME))
	await expect(api('getMe')).resolves.toEqual(ME)
	const [url, init] = fetchMock.mock.calls[0] ?? []
	expect(url).toBe('https://kept.test/api/app/v1/me')
	expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer first')
})

test('a response outside the contract is an error, never partial data', async () => {
	fetchMock.mockResolvedValueOnce(json({ ...ME, setupStep: 'celebrate' }))
	await expect(api('getMe')).rejects.toMatchObject({ code: 'invalid_response' })
})

test('a 401 refreshes once and retries with the new token', async () => {
	fetchMock.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json(ME))
	await expect(api('getMe')).resolves.toEqual(ME)
	const retried = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>
	expect(retried.Authorization).toBe('Bearer second')
	expect(supabase.signOut).not.toHaveBeenCalled()
})

test('a second 401 ends the session on this device', async () => {
	fetchMock.mockResolvedValue(json({}, 401))
	await expect(api('getMe')).rejects.toMatchObject({ code: 'unauthorized', status: 401 })
	expect(supabase.signOut).toHaveBeenCalledTimes(1)
})

test('the server’s error message reaches the screen as written', async () => {
	fetchMock.mockResolvedValueOnce(
		json({ error: { code: 'not_found', message: 'Finish setting up first.' } }, 404)
	)
	await expect(api('getToday')).rejects.toEqual(
		new ApiError('not_found', 'Finish setting up first.', 404)
	)
})

test('a failed fetch is offline or unreachable depending on the phone’s connection', async () => {
	fetchMock.mockRejectedValue(new TypeError('Network request failed'))
	await expect(api('getMe')).rejects.toMatchObject({ code: 'unreachable' })
	jest
		.mocked(NetInfo.fetch)
		.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false } as never)
	await expect(api('getMe')).rejects.toMatchObject({ code: 'offline' })
})

test('retries what a second try can fix, and nothing else', () => {
	expect(shouldRetry(0, new ApiError('unreachable', ''))).toBe(true)
	expect(shouldRetry(0, new ApiError('internal', '', 500))).toBe(true)
	expect(shouldRetry(0, new ApiError('offline', ''))).toBe(false)
	expect(shouldRetry(0, new ApiError('not_found', '', 404))).toBe(false)
	expect(shouldRetry(2, new ApiError('unreachable', ''))).toBe(false)
})
