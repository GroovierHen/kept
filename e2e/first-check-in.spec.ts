import { PrismaClient } from '@prisma/client'
import { test, expect, type Page, type Request } from '@playwright/test'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'
import { choose, HYDRATION_CHECK_MS, TIME_ZONE } from './support/walk-setup'

// Its own client: `db` in src/ is server-only, so a test can't import it.
const db = new PrismaClient({ datasourceUrl: DATABASE_URL })

// The second action of the plan the fake Gemini returns, so the test can't pass
// on the form's default choice.
const CHOSEN_ACTION = 'put my running shoes by the door'
const GOAL = 'I want to run 5k without stopping.'
// The first two key ideas of the plan the fake Gemini returns, taught on Days 1 and 2.
const FIRST_KEY_IDEA = 'Run slow enough to talk'
const SECOND_KEY_IDEA = 'Add about 10% a week'
// A cold run compiles each route on first visit.
const TEST_TIMEOUT_MS = 180_000
const DAY_MS = 24 * 60 * 60 * 1000

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

// Replays a form submission exactly, as a flaky connection's retry would.
async function sendAgain({ page, sent }: { page: Page; sent: Request }) {
	await page.request.fetch(sent.url(), {
		method: 'POST',
		headers: sent.headers(),
		data: sent.postDataBuffer() ?? undefined
	})
}

const dayBefore = (date: Date) => new Date(date.getTime() - DAY_MS)

function onlyOne<T>(rows: T[]): T {
	const [row, ...others] = rows
	if (row == null || others.length > 0) throw new Error(`Expected one row, found ${rows.length}`)
	return row
}

test.use({ timezoneId: TIME_ZONE })
test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')
test.afterAll(() => db.$disconnect())

test('a new user goes from sign-up through their first check-in, and each save matches its Event', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `first-check-in-${crypto.randomUUID()}@example.com`

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

	await test.step('learn the first key idea', async () => {
		await expect(page.getByRole('heading', { name: FIRST_KEY_IDEA })).toBeVisible()
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
			include: {
				goal: true,
				promises: { include: { planAction: true } },
				events: true,
				plan: { include: { keyIdeas: { where: { taughtOn: { not: null } } } } },
				reviews: true
			}
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

		// The first key idea is taught on Day 1 and first comes back the next Kept day.
		const taught = onlyOne(user.plan?.keyIdeas ?? [])
		expect(taught.title).toBe(FIRST_KEY_IDEA)
		expect(onlyOne(eventsNamed('lesson_taught')).details).toEqual({ keyIdeaId: taught.id })
		const review = onlyOne(user.reviews)
		expect(review.keyIdeaId).toBe(taught.id)
		expect(review.dueOn.getTime() - (taught.taughtOn?.getTime() ?? 0)).toBe(DAY_MS)

		onlyOne(eventsNamed('reminder_added'))
		onlyOne(eventsNamed('setup_finished'))
	})

	await test.step('Day 1 is already done', async () => {
		await expect(page.getByRole('heading', { name: 'Day 1' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
		// The closed change panel holds the same sentence, so take the summary's.
		await expect(page.getByText(`After work, I will ${CHOSEN_ACTION}.`).first()).toBeVisible()
	})

	await test.step('a day passes', async () => {
		const user = await db.user.findFirstOrThrow({ where: { email }, include: { promises: true } })
		const promise = onlyOne(user.promises)
		await db.user.update({
			where: { id: user.id },
			data: { createdAt: dayBefore(user.createdAt) }
		})
		await db.promise.update({
			where: { id: promise.id },
			data: { promiseDay: dayBefore(promise.promiseDay), createdAt: dayBefore(promise.createdAt) }
		})
		const taught = await db.keyIdea.findFirstOrThrow({
			where: { plan: { userId: user.id }, taughtOn: { not: null } }
		})
		await db.keyIdea.update({
			where: { id: taught.id },
			data: { taughtOn: dayBefore(taught.taughtOn ?? new Date()) }
		})
		const review = await db.review.findFirstOrThrow({ where: { userId: user.id } })
		await db.review.update({ where: { id: review.id }, data: { dueOn: dayBefore(review.dueOn) } })
		await page.goto('/today')
		await expect(page.getByRole('heading', { name: 'Day 2' })).toBeVisible()
	})

	await test.step('report, and a repeated submission saves once', async () => {
		await expect(
			page.getByRole('heading', { name: 'Did you put your running shoes by the door today?' })
		).toBeVisible()
		const submission = page.waitForRequest((request) => request.method() === 'POST')
		await page.getByRole('button', { name: 'Yes' }).click()
		await expect(page.getByText('Key idea')).toBeVisible()

		await sendAgain({ page, sent: await submission })
	})

	await test.step('learn the second key idea', async () => {
		await expect(page.getByRole('heading', { name: SECOND_KEY_IDEA })).toBeVisible()
		await page.getByRole('button', { name: 'Continue' }).click()
	})

	await test.step('keep the current Promise with one tap, and a repeat saves once', async () => {
		await expect(page.getByRole('radio', { name: CHOSEN_ACTION })).toBeChecked()
		await expect(page.getByRole('radio', { name: 'After work' })).toBeChecked()
		const submission = page.waitForRequest((request) => request.method() === 'POST')
		await page.getByRole('button', { name: 'Make my promise' }).click()
		await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
		await sendAgain({ page, sent: await submission })
	})

	await test.step('done for today', async () => {
		await expect(page.getByRole('heading', { name: 'Day 2' })).toBeVisible()
		await page.reload()
		await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
	})

	await test.step('the Report and next Promise match their Events', async () => {
		const user = await db.user.findFirstOrThrow({
			where: { email },
			include: {
				promises: { orderBy: { promiseDay: 'asc' }, include: { reports: true } },
				events: true
			}
		})
		const [reported, next, ...others] = user.promises
		if (reported == null || next == null || others.length > 0) {
			throw new Error(`Expected two Promises, found ${user.promises.length}`)
		}
		expect(onlyOne(reported.reports).answer).toBe('yes')

		const eventsNamed = (name: string) => user.events.filter((event) => event.name === name)
		const report = onlyOne(eventsNamed('report_made'))
		expect(report.details).toEqual({
			promiseId: reported.id,
			promiseDay: reported.promiseDay.toISOString().slice(0, 10),
			answer: 'yes'
		})
		expect(report.keptDay).toEqual(reported.promiseDay)

		expect(next).toMatchObject({
			wording: CHOSEN_ACTION,
			moment: 'after_work',
			planActionId: reported.planActionId,
			reports: []
		})
		expect(next.promiseDay.getTime() - reported.promiseDay.getTime()).toBe(DAY_MS)
		expect(eventsNamed('promise_committed')).toHaveLength(2)

		// Day 2 taught the second idea, booked its own first review and recorded it once.
		const second = await db.keyIdea.findFirstOrThrow({
			where: { plan: { userId: user.id }, title: SECOND_KEY_IDEA }
		})
		expect(second.taughtOn).toEqual(report.keptDay)
		expect(eventsNamed('lesson_taught')).toHaveLength(2)
		expect(await db.review.count({ where: { userId: user.id, keyIdeaId: second.id } })).toBe(1)
	})

	await test.step('the ledger is one tap away and counts the Report', async () => {
		await page.getByRole('link', { name: 'See your ledger' }).click()
		await expect(page).toHaveURL(/\/ledger$/)
		await expect(page.getByText('1 of 1 promise kept')).toBeVisible()
		await expect(page.getByText('day 2', { exact: true })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Getting bigger' })).toHaveCount(0)
		await expect(page.getByText('Your key ideas show here')).toBeVisible()
		await page.getByRole('link', { name: 'Back to today' }).click()
		await expect(page).toHaveURL(/\/today$/)
	})
})
