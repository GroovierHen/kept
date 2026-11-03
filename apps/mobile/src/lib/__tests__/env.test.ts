import { parseEnv } from '../env'

test('unset, blank and REPLACE_ placeholders all mean not configured', () => {
	const { env, invalid } = parseEnv({
		EXPO_PUBLIC_SITE_URL: '  ',
		EXPO_PUBLIC_SUPABASE_URL: 'REPLACE_WITH_SUPABASE_URL',
		EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined
	})
	expect(env.EXPO_PUBLIC_SITE_URL).toBeUndefined()
	expect(env.EXPO_PUBLIC_SUPABASE_URL).toBeUndefined()
	expect(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeUndefined()
	expect(invalid).toEqual([])
})

test('a malformed value is dropped and named, and the rest still parse', () => {
	const { env, invalid } = parseEnv({
		EXPO_PUBLIC_SITE_URL: 'not a url',
		EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co'
	})
	expect(env.EXPO_PUBLIC_SITE_URL).toBeUndefined()
	expect(env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
	expect(env.EXPO_PUBLIC_POSTHOG_HOST).toBe('https://us.i.posthog.com')
	expect(invalid).toEqual(['EXPO_PUBLIC_SITE_URL'])
})
