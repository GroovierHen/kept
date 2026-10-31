// Where the browser test runs. All of it is local and fixed on purpose: the app
// starts with NODE_ENV=test, which stops Next loading .env.local, and that file
// points at the production database.

// A run against a deployed URL has no local database or fake services.
export const RUNS_AGAINST_LIVE_URL = process.env.E2E_BASE_URL != null

export const APP_PORT = 3100
export const FAKE_SERVICES_PORT = 3101
export const DATABASE_URL = 'postgresql://postgres:postgres@localhost:54329/postgres'

export const DATABASE_ENV = { DATABASE_URL, DIRECT_URL: DATABASE_URL }

export const APP_URL = `http://localhost:${APP_PORT}`
const FAKE_SERVICES_URL = `http://localhost:${FAKE_SERVICES_PORT}`

export const APP_ENV = {
	...DATABASE_ENV,
	NODE_ENV: 'test',
	NEXT_PUBLIC_APP_URL: APP_URL,
	NEXT_PUBLIC_SUPABASE_URL: FAKE_SERVICES_URL,
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fake-publishable-key',
	GOOGLE_GEMINI_BASE_URL: FAKE_SERVICES_URL,
	GEMINI_API_KEY: 'fake-gemini-key'
}
