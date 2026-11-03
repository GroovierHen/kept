import { test, expect } from '@playwright/test'
import { RUNS_AGAINST_LIVE_URL } from './support/test-env'
import { TIME_ZONE } from './support/walk-setup'

// A cold run compiles each route on first visit.
const TEST_TIMEOUT_MS = 120_000

test.use({ timezoneId: TIME_ZONE })
test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')

test('a signed-in user can sign out from setup and the home page', async ({ page }) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const signOut = page.getByRole('button', { name: 'Sign out' })
	const navSignIn = page
		.getByRole('navigation', { name: 'Main' })
		.getByRole('link', { name: 'Sign in' })

	await test.step('sign up and land on setup, with Sign out in its header', async () => {
		await page.goto('/sign-up')
		await expect(page.locator('input[name="timeZone"]')).toHaveValue(TIME_ZONE)
		await page.getByLabel('Email').fill(`sign-out-${crypto.randomUUID()}@example.com`)
		await page.getByLabel('Password').fill('a-test-password')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL(/\/setup$/)
		await expect(signOut).toBeVisible()
	})

	await test.step('the home page offers Sign out and a way back in, not Sign in', async () => {
		await page.goto('/')
		await expect(signOut).toBeVisible()
		await expect(page.getByRole('link', { name: 'Open Kept' })).toBeVisible()
		await expect(navSignIn).toHaveCount(0)
	})

	await test.step('signing out lands on the home page, signed out', async () => {
		await page.goto('/setup')
		await signOut.click()
		await expect(navSignIn).toBeVisible()
		await expect(signOut).toHaveCount(0)
		await page.goto('/today')
		await expect(page).toHaveURL(/\/sign-in$/)
	})
})
