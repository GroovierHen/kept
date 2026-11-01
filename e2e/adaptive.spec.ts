import { PrismaClient } from '@prisma/client'
import { test, expect, type Page } from '@playwright/test'
import { daysPass } from './support/days-pass'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'
import { choose, HYDRATION_CHECK_MS, TIME_ZONE, walkToPromiseStep } from './support/walk-setup'

// Its own client: `db` in src/ is server-only, so a test can't import it.
const db = new PrismaClient({ datasourceUrl: DATABASE_URL })

const RUN = {
	small: 'walk and jog for 10 minutes',
	medium: 'run 20 minutes, walk breaks allowed'
}
const GET_READY = 'put my running shoes by the door'
const TYPED = 'walk round the block'
const SMALLER_TYPED = 'walk to the corner'
const DIFFERENT_ACTION_NUDGE = 'here’s a different action from your plan'
const TYPE_SMALLER_NUDGE = 'Try typing a smaller version.'
// A cold run compiles each route on first visit, and these walk many days.
const TEST_TIMEOUT_MS = 300_000

type Answer = 'Yes' | 'Partly' | 'No'

test.use({ timezoneId: TIME_ZONE })
test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')
test.afterAll(() => db.$disconnect())

async function finishSetup(page: Page) {
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

async function startWith({ page, email, typed }: { page: Page; email: string; typed?: string }) {
	await walkToPromiseStep({ page, email })
	if (typed != null) {
		await expect(async () => {
			await page.getByRole('button', { name: 'Type my own' }).click()
			await expect(page.getByLabel('Your own promise')).toBeVisible({
				timeout: HYDRATION_CHECK_MS
			})
		}).toPass()
		await page.getByLabel('Your own promise').fill(typed)
	}
	await choose({ page, name: 'After work' })
	await finishSetup(page)
}

/** A new Kept day, up to the commit step. */
async function reportNextDay({
	page,
	email,
	answer
}: {
	page: Page
	email: string
	answer: Answer
}) {
	await daysPass({ db, email, days: 1 })
	// The stand-in for Learn's saved card is a cookie holding today's real date.
	await page.context().clearCookies({ name: /^kept_today_learned_/ })
	await page.goto('/today')
	await page.getByRole('button', { name: answer, exact: true }).click()
	await page.getByRole('button', { name: 'Continue' }).click()
	await expect(page.getByRole('heading', { name: 'Your next promise' })).toBeVisible()
}

async function commit(page: Page) {
	await page.getByRole('button', { name: 'Make my promise' }).click()
	await expect(page.getByRole('heading', { name: 'Done for today' })).toBeVisible()
}

async function checkIn(input: { page: Page; email: string; answer: Answer }) {
	await reportNextDay(input)
	await commit(input.page)
}

const latestPromise = (email: string) =>
	db.promise.findFirstOrThrow({
		where: { user: { email } },
		orderBy: { promiseDay: 'desc' }
	})

test('a Run grows a Promise, shrinks it at two Noes, and offers another Action at small', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `adaptive-${crypto.randomUUID()}@example.com`
	await startWith({ page, email })

	await test.step('Yes on days 2 and 3 keeps it small', async () => {
		await checkIn({ page, email, answer: 'Yes' })
		await checkIn({ page, email, answer: 'Yes' })
		expect(await latestPromise(email)).toMatchObject({ size: 'small', wording: RUN.small })
	})

	await test.step('the third Yes moves the Promise for day 5 up, and the form has no say', async () => {
		await reportNextDay({ page, email, answer: 'Yes' })
		await expect(page.getByRole('radio', { name: RUN.medium })).toBeChecked()
		await expect(page.getByRole('radio', { name: RUN.small })).toBeHidden()
		await expect(page.getByText(`After work, I will ${RUN.medium}.`)).toBeVisible()

		// A form sent with a Size and wording of its own saves neither.
		await page
			.locator('form:has(input[name="actionId"])')
			.first()
			.evaluate((form) => {
				for (const [name, value] of [
					['size', 'large'],
					['wording', 'run a marathon']
				] as const) {
					const field = document.createElement('input')
					field.type = 'hidden'
					field.name = name
					field.value = value
					form.append(field)
				}
			})
		await commit(page)
		const promise = await latestPromise(email)
		expect(promise).toMatchObject({ size: 'medium', wording: RUN.medium })
		const committed = await db.event.findFirstOrThrow({
			where: {
				name: 'promise_committed',
				user: { email },
				details: { path: ['promiseId'], equals: promise.id }
			}
		})
		expect(committed.details).toMatchObject({ size: 'medium' })
	})

	await test.step('switching Action and coming back picks up its Size', async () => {
		await reportNextDay({ page, email, answer: 'Yes' })
		await choose({ page, name: GET_READY })
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: 'small', wording: GET_READY })

		await reportNextDay({ page, email, answer: 'Yes' })
		await choose({ page, name: RUN.medium })
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: 'medium', wording: RUN.medium })
	})

	await test.step('No, Partly, No holds steady', async () => {
		await checkIn({ page, email, answer: 'No' })
		await checkIn({ page, email, answer: 'Partly' })
		await checkIn({ page, email, answer: 'No' })
		expect(await latestPromise(email)).toMatchObject({ size: 'medium', wording: RUN.medium })
	})

	await test.step('No, Unreported, No moves it down', async () => {
		// Past the day after its own, so the Promise closes Unreported.
		await daysPass({ db, email, days: 3 })
		await page.context().clearCookies({ name: /^kept_today_learned_/ })
		await page.goto('/today')
		await expect(page.getByText('Your last promise closed as Unreported.')).toBeVisible()
		await page.getByRole('button', { name: 'Continue' }).click()
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: 'medium', wording: RUN.medium })

		await reportNextDay({ page, email, answer: 'No' })
		await expect(page.getByRole('radio', { name: RUN.small })).toBeChecked()
		await expect(page.getByText(DIFFERENT_ACTION_NUDGE)).toBeHidden()
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: 'small', wording: RUN.small })
	})

	await test.step('at small, two more Noes keep it small and offer a different Action', async () => {
		await checkIn({ page, email, answer: 'No' })
		await reportNextDay({ page, email, answer: 'No' })
		await expect(page.getByText(DIFFERENT_ACTION_NUDGE)).toBeVisible()
		await expect(page.getByRole('radio', { name: GET_READY })).toBeChecked()

		await choose({ page, name: RUN.small })
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: 'small', wording: RUN.small })
	})
})

test('a changed Report moves the next commit and leaves a committed Promise alone', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `adaptive-changed-${crypto.randomUUID()}@example.com`
	await startWith({ page, email })
	await checkIn({ page, email, answer: 'Yes' })
	await checkIn({ page, email, answer: 'Yes' })

	await test.step('before committing, the picker follows the change', async () => {
		await reportNextDay({ page, email, answer: 'Yes' })
		await expect(page.getByRole('radio', { name: RUN.medium })).toBeChecked()

		await page.getByText('You answered Yes. Change my answer').click()
		await page.getByRole('button', { name: 'No', exact: true }).click()
		await expect(page.getByText('You answered No. Change my answer')).toBeVisible()
		await expect(page.getByRole('radio', { name: RUN.small })).toBeChecked()

		await page.getByText('You answered No. Change my answer').click()
		await page.getByRole('button', { name: 'Yes', exact: true }).click()
		await expect(page.getByRole('radio', { name: RUN.medium })).toBeChecked()
		await commit(page)
	})

	await test.step('after committing, the Promise stays, even when only its moment changes', async () => {
		const before = await latestPromise(email)
		await page.getByText('You answered Yes. Change my answer').click()
		await page.getByRole('button', { name: 'No', exact: true }).click()
		await expect(page.getByText('You answered No. Change my answer')).toBeVisible()
		expect(await latestPromise(email)).toEqual(before)

		await page.getByText('Change this promise').click()
		await expect(page.getByRole('radio', { name: RUN.medium })).toBeChecked()
		await choose({ page, name: 'Before bed' })
		await page.getByRole('button', { name: 'Change my promise' }).click()
		await expect.poll(async () => (await latestPromise(email)).moment).toBe('before_bed')
		expect(await latestPromise(email)).toMatchObject({
			id: before.id,
			size: 'medium',
			wording: RUN.medium
		})
		const changed = await db.event.findFirstOrThrow({
			where: {
				name: 'promise_changed',
				user: { email },
				details: { path: ['promiseId'], equals: before.id }
			}
		})
		expect(changed.details).toMatchObject({ size: 'medium', moment: 'before_bed' })
	})
})

test('two Noes on a Typed promise ask for a smaller one, and three Yeses change nothing', async ({
	page
}) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `adaptive-typed-${crypto.randomUUID()}@example.com`
	await startWith({ page, email, typed: TYPED })

	await test.step('three Yeses keep the same wording, with nothing asked', async () => {
		await checkIn({ page, email, answer: 'Yes' })
		await checkIn({ page, email, answer: 'Yes' })
		await reportNextDay({ page, email, answer: 'Yes' })
		await expect(page.getByLabel('Your own promise')).toHaveValue(TYPED)
		await expect(page.getByText(TYPE_SMALLER_NUDGE)).toBeHidden()
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: null, wording: TYPED })
	})

	await test.step('two Noes ask for a smaller one, and the smaller one starts over', async () => {
		await checkIn({ page, email, answer: 'No' })
		await reportNextDay({ page, email, answer: 'No' })
		await expect(page.getByText(TYPE_SMALLER_NUDGE)).toBeVisible()
		await expect(page.getByLabel('Your own promise')).toHaveValue(TYPED)

		await page.getByLabel('Your own promise').fill(SMALLER_TYPED)
		await commit(page)
		expect(await latestPromise(email)).toMatchObject({ size: null, wording: SMALLER_TYPED })

		await reportNextDay({ page, email, answer: 'No' })
		await expect(page.getByText(TYPE_SMALLER_NUDGE)).toBeHidden()
	})
})
