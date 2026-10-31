import { PrismaClient } from '@prisma/client'
import { test, expect, type Page, type Request } from '@playwright/test'
import { daysPass as passDays } from './support/days-pass'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'
import { choose, HYDRATION_CHECK_MS, TIME_ZONE, walkToPromiseStep } from './support/walk-setup'

// Its own client: `db` in src/ is server-only, so a test can't import it.
const db = new PrismaClient({ datasourceUrl: DATABASE_URL })

const FIRST_ACTION = 'walk and jog for 10 minutes'
const SECOND_ACTION = 'put my running shoes by the door'
// A cold run compiles each route on first visit.
const TEST_TIMEOUT_MS = 180_000
const DAY_MS = 24 * 60 * 60 * 1000

test.use({ timezoneId: TIME_ZONE })
test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')
test.afterAll(() => db.$disconnect())

const daysPass = (input: { email: string; days: number }) => passDays({ db, ...input })

async function commitFirstPromise(page: Page) {
	await choose({ page, name: SECOND_ACTION })
	await choose({ page, name: 'After work' })
	await page.getByRole('button', { name: 'Make my promise' }).click()
	const addReminder = page.getByRole('link', { name: 'Add daily reminder' })
	await expect(async () => {
		await page.getByLabel('Remind me at').fill('07:30')
		await expect(addReminder).toHaveAttribute('href', /time=07%3A30/, {
			timeout: HYDRATION_CHECK_MS
		})
	}).toPass()
	const calendarFile = page.waitForEvent('download')
	await addReminder.click()
	await calendarFile
	await page.getByRole('link', { name: 'Go to today' }).click()
	await expect(page).toHaveURL(/\/today$/)
}

const eventCount = (email: string, name: string) =>
	db.event.count({ where: { name, user: { email } } })

function latestReports(email: string) {
	return db.report.findMany({
		where: { promise: { user: { email } } },
		orderBy: { createdAt: 'asc' }
	})
}

async function sendAgain({ page, sent }: { page: Page; sent: Request }) {
	await page.request.fetch(sent.url(), {
		method: 'POST',
		headers: sent.headers(),
		data: sent.postDataBuffer() ?? undefined
	})
}

test('a user changes a Report and a Promise, and neither disturbs the other', async ({ page }) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `corrections-${crypto.randomUUID()}@example.com`
	await walkToPromiseStep({ page, email })
	await commitFirstPromise(page)
	await daysPass({ email, days: 1 })

	await test.step('report Yes, pass the learn card, commit the next Promise', async () => {
		await page.goto('/today')
		await page.getByRole('button', { name: 'Yes' }).click()
		await page.getByRole('button', { name: 'Continue' }).click()
		await page.getByRole('button', { name: 'Make my promise' }).click()
		await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
	})

	await test.step('change the Report: a new row and Event, and the Promise stays', async () => {
		const before = await db.promise.findMany({
			where: { user: { email } },
			orderBy: { promiseDay: 'desc' }
		})
		await page.getByText('You answered Yes. Change my answer').click()
		const submission = page.waitForRequest((request) => request.method() === 'POST')
		await page.getByRole('button', { name: 'No' }).click()
		await expect(page.getByText('You answered No. Change my answer')).toBeVisible()
		await sendAgain({ page, sent: await submission })

		const reports = await latestReports(email)
		expect(reports.map(({ answer }) => answer)).toEqual(['yes', 'no'])
		expect(await eventCount(email, 'report_made')).toBe(2)
		expect(
			await db.promise.findMany({ where: { user: { email } }, orderBy: { promiseDay: 'desc' } })
		).toEqual(before)
		await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
	})

	await test.step('the same answer again adds nothing', async () => {
		await page.getByText('You answered No. Change my answer').click()
		await page.getByRole('button', { name: 'No' }).click()
		await page.reload()
		expect(await latestReports(email)).toHaveLength(2)
	})

	await test.step('change the committed Promise: same row and day, its own Event', async () => {
		const [before] = await db.promise.findMany({
			where: { user: { email } },
			orderBy: { promiseDay: 'desc' }
		})
		await page.getByText('Change this promise').click()
		await choose({ page, name: FIRST_ACTION })
		await choose({ page, name: 'Before bed' })
		const submission = page.waitForRequest((request) => request.method() === 'POST')
		await page.getByRole('button', { name: 'Change my promise' }).click()
		await expect(page.getByRole('button', { name: 'Change my promise' })).toBeHidden()
		await expect(page.getByText(`Before bed, I will ${FIRST_ACTION}.`).first()).toBeVisible()
		await sendAgain({ page, sent: await submission })

		const [after] = await db.promise.findMany({
			where: { user: { email } },
			orderBy: { promiseDay: 'desc' }
		})
		expect(after).toMatchObject({
			id: before?.id,
			promiseDay: before?.promiseDay,
			wording: FIRST_ACTION,
			moment: 'before_bed'
		})
		expect(await eventCount(email, 'promise_changed')).toBe(1)
		expect(await eventCount(email, 'promise_committed')).toBe(2)
		expect(await latestReports(email)).toHaveLength(2)
	})

	await test.step('after 4am neither can be changed', async () => {
		await daysPass({ email, days: 1 })
		await page.goto('/today')
		await expect(page.getByText('Change my answer')).toBeHidden()
		await expect(page.getByText('Change this promise')).toBeHidden()
	})
})

test('a late Report is accepted, and a Promise nobody reports closes with a note and no Event', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `gap-${crypto.randomUUID()}@example.com`
	await walkToPromiseStep({ page, email })
	await commitFirstPromise(page)

	await test.step('the day after the Promise, it can still be reported', async () => {
		await daysPass({ email, days: 2 })
		await page.goto('/today')
		await expect(
			page.getByRole('heading', { name: 'Did you put your running shoes by the door yesterday?' })
		).toBeVisible()
	})

	await test.step('a day later it has closed: a note, no Report step, nothing saved', async () => {
		await daysPass({ email, days: 1 })
		const eventsBefore = await db.event.count({ where: { user: { email } } })
		await page.goto('/today')
		await expect(page.getByText('Your last promise closed as Unreported.')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Yes' })).toBeHidden()
		expect(await db.event.count({ where: { user: { email } } })).toBe(eventsBefore)
		expect(await eventCount(email, 'report_made')).toBe(0)
	})

	await test.step('the next Promise is for that same day, and the note goes', async () => {
		await page.getByRole('button', { name: 'Continue' }).click()
		await page.getByRole('button', { name: 'Make my promise' }).click()
		await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
		await expect(page.getByText('Your last promise closed as Unreported.')).toBeHidden()
	})
})

test('a user who reported and left starts at commit the next day, with a Promise for that day', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `left-${crypto.randomUUID()}@example.com`
	await walkToPromiseStep({ page, email })
	await commitFirstPromise(page)
	await daysPass({ email, days: 1 })

	await page.goto('/today')
	await page.getByRole('button', { name: 'Partly' }).click()
	await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

	await daysPass({ email, days: 1 })
	await page.goto('/today')
	await expect(page.getByRole('heading', { name: 'Your next promise' })).toBeVisible()
	await expect(page.getByText('Change my answer')).toBeHidden()
	await page.getByRole('button', { name: 'Make my promise' }).click()
	await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()

	const [next, reported] = await db.promise.findMany({
		where: { user: { email } },
		orderBy: { promiseDay: 'desc' }
	})
	expect(next?.promiseDay.getTime()).toBe((reported?.promiseDay.getTime() ?? 0) + DAY_MS)
	// Committed today, for today: the event's Kept day is the Promise's own.
	const committed = await db.event.findFirstOrThrow({
		where: {
			name: 'promise_committed',
			user: { email },
			details: { path: ['promiseId'], equals: next?.id }
		}
	})
	expect(committed.keptDay).toEqual(next?.promiseDay)
})
