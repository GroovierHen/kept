import { PrismaClient } from '@prisma/client'
import { test, expect, type Page } from '@playwright/test'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'

// Its own client: `db` in src/ is server-only, so a test can't import it.
const db = new PrismaClient({ datasourceUrl: DATABASE_URL })

const COUNTED_GOAL = 'A private counted goal nobody should read'
const DEMO_GOAL = 'A private demo goal nobody should read'
const TODAY = new Date(new Date().toISOString().slice(0, 10))
// A cold run compiles the route on first visit.
const TEST_TIMEOUT_MS = 120_000

async function seedAccount({
	email,
	goal,
	isDemo
}: {
	email: string
	goal: string
	isDemo: boolean
}) {
	const userId = crypto.randomUUID()
	await db.user.create({
		data: {
			id: userId,
			email,
			isDemo,
			isCountedInResults: !isDemo,
			goal: { create: { text: goal } },
			events: {
				create: { name: 'signed_up', keptDay: TODAY, idempotencyKey: 'signed_up' }
			}
		}
	})
}

// next dev refills the page's cached read for a no-cache request, so a test
// doesn't wait out the minute real visitors share.
async function freshResults(page: Page) {
	const response = await page.request.get('/results', { headers: { 'cache-control': 'no-cache' } })
	expect(response.ok()).toBe(true)
	return response.text()
}

test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database')
test.afterAll(() => db.$disconnect())

test('the results page shows counted accounts to anyone, with nothing private', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const countedEmail = `results-counted-${crypto.randomUUID()}@example.com`
	const demoEmail = `results-demo-${crypto.randomUUID()}@example.com`
	await seedAccount({ email: countedEmail, goal: COUNTED_GOAL, isDemo: false })
	await seedAccount({ email: demoEmail, goal: DEMO_GOAL, isDemo: true })

	await test.step('signed up matches the counted accounts, not the demo one', async () => {
		// Another spec may be signing up at the same moment, so read until the two agree.
		await expect(async () => {
			const expected = await db.event.count({
				where: { name: 'signed_up', user: { isCountedInResults: true, isDemo: false } }
			})
			await page.setContent(await freshResults(page))
			await expect(
				page.locator('dt', { hasText: 'Signed up' }).locator('xpath=following-sibling::dd')
			).toHaveText(String(expected), { timeout: 1 })
		}).toPass()
	})

	await test.step('no email or goal reaches the page', async () => {
		const html = await freshResults(page)
		for (const privateText of [countedEmail, demoEmail, COUNTED_GOAL, DEMO_GOAL]) {
			expect(html).not.toContain(privateText)
		}
	})

	await test.step('anyone can read it, Learn’s stub stays off it, and it joins the index', async () => {
		await page.goto('/results')
		await expect(page).toHaveURL(/\/results$/)
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
		await expect(page.getByText('No key idea has been recalled twice yet.')).toBeVisible()
		await expect(page.getByText('Run slow enough to talk')).toHaveCount(0)
		await expect(page.getByText(/reminder/i)).toHaveCount(0)
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/results$/)
	})
})
