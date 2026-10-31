import { PrismaClient } from '@prisma/client'
import { test, expect, type Page } from '@playwright/test'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'

// Its own client: `db` in src/ is server-only, so a test can't import it.
const db = new PrismaClient({ datasourceUrl: DATABASE_URL })

const TIME_ZONE = 'Asia/Karachi'
// The second action of the plan the fake Gemini returns, so the test can't pass
// on the form's default choice.
const CHOSEN_ACTION = 'put my running shoes by the door'
const GOAL = 'I want to run 5k without stopping.'
// A cold run compiles each route on first visit.
const TEST_TIMEOUT_MS = 180_000
const HYDRATION_CHECK_MS = 500
const DAY_MS = 24 * 60 * 60 * 1000

// A radio does nothing until the page has hydrated, so keep tapping until it takes.
async function choose({ page, name }: { page: Page; name: string }) {
	const radio = page.getByRole('radio', { name })
	await expect(async () => {
		await radio.click()
		await expect(radio).toBeChecked({ timeout: HYDRATION_CHECK_MS })
	}).toPass()
}

async function answerGoalQuestion({
	page,
	question,
	answer
}: {
	page: Page
	question: string
	answer: string
}) {
	await page.getByRole('textbox', { name: question }).fill(answer)
	await page.getByRole('button', { name: 'Continue' }).click()
}

function onlyOne<T>(rows: T[]): T {
	const [row, ...others] = rows
	if (row == null || others.length > 0) throw new Error(`Expected one row, found ${rows.length}`)
	return row
}

test.use({ timezoneId: TIME_ZONE })
test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')
test.afterAll(() => db.$disconnect())

test('a new user goes from sign-up to the reminder, and the Promise matches its Event', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `day-1-${crypto.randomUUID()}@example.com`

	await test.step('sign up', async () => {
		await page.goto('/sign-up')
		// The browser fills this in once the page has hydrated.
		await expect(page.locator('input[name="timeZone"]')).toHaveValue(TIME_ZONE)
		await page.getByLabel('Email').fill(email)
		await page.getByLabel('Password').fill('a-test-password')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL(/\/setup$/)
	})

	await test.step('answer the goal questions', async () => {
		await answerGoalQuestion({
			page,
			question: 'What do you want to get better at?',
			answer: GOAL
		})
		await choose({ page, name: '8 weeks' })
		await page.getByRole('button', { name: 'Continue' }).click()
		await answerGoalQuestion({
			page,
			question: 'Where are you now?',
			answer: 'I can jog about 1 km.'
		})
		await answerGoalQuestion({
			page,
			question: 'What usually gets in your way?',
			answer: 'I am tired after work.'
		})
	})

	await test.step('make and confirm the plan', async () => {
		await page.getByRole('button', { name: 'Make my plan' }).click()
		await page.getByRole('button', { name: 'Confirm my plan' }).click()
	})

	// TEMPORARY: a placeholder until the key idea step lands (#31).
	await test.step('pass the key idea', async () => {
		await expect(page.getByText('Your first key idea')).toBeVisible()
		await page.getByRole('button', { name: 'Continue' }).click()
	})

	await test.step('commit a Promise', async () => {
		await choose({ page, name: CHOSEN_ACTION })
		await choose({ page, name: 'After work' })
		await expect(page.getByText(`After work, I will ${CHOSEN_ACTION}.`)).toBeVisible()
		await page.getByRole('button', { name: 'Make my promise' }).click()
	})

	await test.step('add the reminder', async () => {
		const addReminder = page.getByRole('link', { name: 'Add daily reminder' })
		await expect(async () => {
			await page.getByLabel('Remind me at').fill('07:30')
			await expect(addReminder).toHaveAttribute('href', /time=07%3A30/, {
				timeout: HYDRATION_CHECK_MS
			})
		}).toPass()
		const calendarFile = page.waitForEvent('download')
		await addReminder.click()
		expect((await calendarFile).suggestedFilename()).toMatch(/\.ics$/)
		await expect(page.getByRole('status')).toContainText('Your daily reminder is ready')
		await page.getByRole('link', { name: 'Go to today' }).click()
		await expect(page).toHaveURL(/\/today$/)
	})

	await test.step('the saved Promise and its Event agree', async () => {
		const user = await db.user.findFirstOrThrow({
			where: { email },
			include: { goal: true, promises: { include: { planAction: true } }, events: true }
		})
		expect(user.goal).toMatchObject({ text: GOAL, weeks: 8 })
		expect(user.timeZone).toBe(TIME_ZONE)
		expect(user.firstReminderTime).toBe('07:30')

		const promise = onlyOne(user.promises)
		expect(promise).toMatchObject({
			wording: CHOSEN_ACTION,
			size: 'small',
			moment: 'after_work',
			planAction: { small: CHOSEN_ACTION }
		})

		const eventsNamed = (name: string) => user.events.filter((event) => event.name === name)
		const committed = onlyOne(eventsNamed('promise_committed'))
		expect(committed.details).toEqual({
			promiseId: promise.id,
			promiseDay: promise.promiseDay.toISOString().slice(0, 10),
			actionId: promise.planActionId,
			size: 'small',
			moment: 'after_work'
		})
		// Tonight's Promise is for the next Kept day.
		expect(promise.promiseDay.getTime() - committed.keptDay.getTime()).toBe(DAY_MS)

		onlyOne(eventsNamed('reminder_added'))
		onlyOne(eventsNamed('setup_finished'))
	})
})
