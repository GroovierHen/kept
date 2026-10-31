import { defineConfig, devices } from '@playwright/test'
import { APP_ENV, APP_PORT, APP_URL, RUNS_AGAINST_LIVE_URL } from './e2e/support/test-env'

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	// A cold run compiles routes on demand per worker, which can take longer
	// than Playwright's 30s default before anything is warm — an expiry there
	// reads as a spurious failure rather than a real one.
	timeout: 60_000,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	globalSetup: './e2e/global-setup.ts',
	use: {
		baseURL: process.env.E2E_BASE_URL ?? APP_URL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	// Boots the app itself for local runs; CI (and any review skill running
	// against an already-live URL via E2E_BASE_URL) should skip this by
	// setting E2E_BASE_URL and leaving webServer unused — see
	// .claude/skills/e2e-review/SKILL.md.
	//
	// Never reuses a running server: a normal `pnpm dev` loads .env.local, which
	// points at the production database, and this test writes to its database.
	webServer: RUNS_AGAINST_LIVE_URL
		? undefined
		: {
				command: `pnpm dev --port ${APP_PORT}`,
				url: APP_URL,
				reuseExistingServer: false,
				env: APP_ENV,
				timeout: 60_000
			}
})
