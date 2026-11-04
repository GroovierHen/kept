import { createPrismaClient } from '../src/server/db/create-client'
import { test, expect } from '@playwright/test'
import { checkInView, endpoints, errorBodySchema, type CheckInView } from '@kept/contract'
import { accessToken, appClient } from './support/app-api'
import { daysPass } from './support/days-pass'
import { FAKE_GRADE } from './support/fake-services'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'
import { finishSetup, TIME_ZONE, walkToPromiseStep } from './support/walk-setup'

// The app's check-in, end to end through /api/app/v1 with a bearer token, as
// the phone sends it: the same Day 2 as first-check-in.spec.ts, with no page.

const db = createPrismaClient(DATABASE_URL)
const CHOSEN_ACTION = 'put my running shoes by the door'
const TEST_TIMEOUT_MS = 180_000

test.use({ timezoneId: TIME_ZONE })
test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')
test.afterAll(() => db.$disconnect())

function stepOf<S extends CheckInView['step']>(view: CheckInView, step: S) {
	expect(view.step).toBe(step)
	return checkInView.parse(view) as Extract<CheckInView, { step: S }>
}

test('the app checks in through the API, and each write saves once', async ({ page, request }) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `app-check-in-${crypto.randomUUID()}@example.com`

	await test.step('set up on the web', async () => {
		await walkToPromiseStep({ page, email })
		await finishSetup({ page, action: CHOSEN_ACTION })
	})

	const api = appClient(request, await accessToken(request, email))

	await test.step('without a token, every route is a 401', async () => {
		const response = await request.get(endpoints.getToday.path)
		expect(response.status()).toBe(401)
		expect(errorBodySchema.parse(await response.json()).error.code).toBe('unauthorized')
	})

	await test.step('Day 1 is done, with the promise still changeable', async () => {
		const today = await api.today()
		expect(today.day).toBe(1)
		const done = stepOf(today.checkIn, 'done')
		expect(done.change?.initial).toMatchObject({ moment: 'after_work', typed: null })
		expect(done.learned?.title).toBe('Run slow enough to talk')
	})

	await daysPass({ db, email, days: 1 })
	const reportId = crypto.randomUUID()

	await test.step('report Yes, sent twice as a retry would, saves once', async () => {
		const today = await api.today()
		expect(today.day).toBe(2)
		const report = stepOf(today.checkIn, 'report')
		expect(report.when).toBe('today')
		const body = { promiseId: report.promiseId, reportId, answer: 'yes' }
		await api.ok('submitReport', body)
		await api.ok('submitReport', body)
		expect(await db.report.count({ where: { promiseId: report.promiseId } })).toBe(1)
	})

	await test.step('a report on a Promise that is not theirs is a 404', async () => {
		const response = await api.call('submitReport', {
			promiseId: crypto.randomUUID(),
			reportId: crypto.randomUUID(),
			answer: 'no'
		})
		expect(response.status()).toBe(404)
		expect(errorBodySchema.parse(await response.json()).error.code).toBe('not_found')
	})

	await test.step('the recall is marked by the AI', async () => {
		const today = await api.today()
		expect(today.changeableReport).toMatchObject({ answer: 'yes', when: 'today' })
		const learn = stepOf(today.checkIn, 'learn')
		expect(learn.recall?.question).toBe('Why should most of your runs feel easy?')
		const result = await api.ok('answerRecall', {
			mode: 'typed',
			keyIdeaId: learn.recall?.keyIdeaId,
			answer: 'So I can keep going.'
		})
		expect(result).toMatchObject({ kind: 'graded', score: FAKE_GRADE.score })
	})

	await test.step('the new idea, then the commit step with the current promise picked', async () => {
		const learn = stepOf((await api.today()).checkIn, 'learn')
		expect(learn.recall).toBeNull()
		expect(learn.lesson?.title).toBe('Add about 10% a week')
		await api.ok('finishLesson', { keyIdeaId: learn.lesson?.keyIdeaId })

		const commit = stepOf((await api.today()).checkIn, 'commit')
		expect(commit.hasCurrent).toBe(true)
		const chosen = commit.picker.actions.find(({ wording }) => wording === CHOSEN_ACTION)
		expect(commit.picker.initial).toEqual({
			moment: 'after_work',
			actionId: chosen?.id,
			typed: null
		})
		const choice = { kind: 'action', moment: 'after_work', actionId: chosen?.id }
		await api.ok('commitPromise', choice)
		await api.ok('commitPromise', choice)
	})

	await test.step('done, and the new promise changes to a typed one', async () => {
		const done = stepOf((await api.today()).checkIn, 'done')
		expect(done.change).not.toBeNull()
		const change = {
			promiseId: done.change?.promiseId,
			changeId: crypto.randomUUID(),
			choice: { kind: 'typed', moment: 'wake_up', wording: 'stretch for five minutes' }
		}
		await api.ok('changePromise', change)
		await api.ok('changePromise', change)

		const user = await db.user.findFirstOrThrow({
			where: { email },
			include: { promises: { orderBy: { promiseDay: 'asc' } }, events: true }
		})
		expect(user.promises).toHaveLength(2)
		expect(user.promises[1]).toMatchObject({
			wording: 'stretch for five minutes',
			moment: 'wake_up',
			planActionId: null
		})
		const count = (name: string) => user.events.filter((event) => event.name === name).length
		expect(count('report_made')).toBe(1)
		expect(count('recall_graded')).toBe(1)
		expect(count('promise_changed')).toBe(1)
	})
})
