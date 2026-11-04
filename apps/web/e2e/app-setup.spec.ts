import { createPrismaClient } from '../src/server/db/create-client'
import { test, expect } from '@playwright/test'
import { endpoints, errorBodySchema, setupResponse, type SetupView } from '@kept/contract'
import { accessToken, appClient } from './support/app-api'
import { DATABASE_URL, RUNS_AGAINST_LIVE_URL } from './support/test-env'
import { TIME_ZONE } from './support/walk-setup'

// Sign-up and setup as the phone does them, all through /api/app/v1: the
// account saved on the first read, the goal's four answers, the plan the fake
// AI writes, an edit, Confirm, the first key idea, promise and reminder.

const db = createPrismaClient(DATABASE_URL)
const TEST_TIMEOUT_MS = 120_000

test.skip(RUNS_AGAINST_LIVE_URL, 'Needs the local database and fake services')
test.afterAll(() => db.$disconnect())

function viewOf<S extends SetupView['step']>(view: SetupView, step: S) {
	expect(view.step).toBe(step)
	return view as Extract<SetupView, { step: S }>
}

test('a new account is set up from the app, one saved step at a time', async ({ request }) => {
	test.setTimeout(TEST_TIMEOUT_MS)
	const email = `app-setup-${crypto.randomUUID()}@example.com`
	const api = appClient(request, await accessToken(request, email))
	const setup = async () => setupResponse.parse(await api.ok('getSetup')).view

	await test.step('the first read saves the account, with the phone’s time zone, once', async () => {
		const me = await api.ok('provisionMe', { timeZone: TIME_ZONE })
		expect(me.setupStep).toBe('goal')
		await api.ok('provisionMe', { timeZone: 'Europe/Paris' })
		const user = await db.user.findFirstOrThrow({ where: { email }, include: { events: true } })
		expect(user.timeZone).toBe(TIME_ZONE)
		expect(user.events.filter(({ name }) => name === 'signed_up')).toHaveLength(1)
	})

	await test.step('the goal, one question at a time', async () => {
		expect(viewOf(await setup(), 'goal').question).toBe('text')
		await api.ok('saveGoalAnswer', {
			question: 'text',
			answer: 'I want to run 5k without stopping.'
		})
		expect(viewOf(await setup(), 'goal').question).toBe('weeks')
		const badWeeks = await api.call('saveGoalAnswer', { question: 'weeks', answer: 6 })
		expect(badWeeks.status()).toBe(400)
		await api.ok('saveGoalAnswer', { question: 'weeks', answer: 8 })
		await api.ok('saveGoalAnswer', { question: 'startingPoint', answer: 'About 1 km.' })
		await api.ok('saveGoalAnswer', { question: 'obstacle', answer: 'I am tired after work.' })
		const plan = viewOf(await setup(), 'plan').plan
		expect(plan).toMatchObject({ status: 'goal_saved', isBuilding: false })
	})

	await test.step('the AI writes the plan, and the goal is locked from then on', async () => {
		expect(await api.ok('buildPlan')).toEqual({ kind: 'saved' })
		expect(await api.ok('buildPlan')).toEqual({ kind: 'skipped' })
		const locked = await api.call('saveGoalAnswer', { question: 'text', answer: 'Something else' })
		expect(locked.status()).toBe(409)
		expect(errorBodySchema.parse(await locked.json()).error.code).toBe('conflict')
	})

	await test.step('an action is reworded, then the plan confirmed', async () => {
		const { plan } = viewOf(await setup(), 'plan')
		if (plan.status !== 'plan_made') throw new Error('Expected a plan')
		expect(plan.draft.canRebuild).toBe(true)
		const [first] = plan.draft.actions
		if (first == null) throw new Error('Expected an action')
		const sizes = { small: 'walk for 5 minutes', medium: first.medium, large: first.large }
		expect(await api.ok('editPlanAction', { intent: 'save', actionId: first.id, sizes })).toEqual({
			result: 'saved'
		})
		await api.ok('confirmPlan')
		await api.ok('confirmPlan')
		expect(await api.ok('editPlanAction', { intent: 'remove', actionId: first.id })).toEqual({
			result: 'locked'
		})
	})

	await test.step('the first key idea, promise and reminder finish setup', async () => {
		const { lesson } = viewOf(await setup(), 'keyIdea')
		expect(lesson?.title).toBe('Run slow enough to talk')
		await api.ok('learnFirstKeyIdea', { keyIdeaId: lesson?.keyIdeaId })

		const { actions } = viewOf(await setup(), 'promise')
		expect(actions[0]?.wording).toBe('walk for 5 minutes')
		await api.ok('commitFirstPromise', {
			kind: 'action',
			moment: 'after_work',
			actionId: actions[0]?.id
		})

		viewOf(await setup(), 'reminder')
		const badTime = await api.call('saveReminder', { time: '25:00' })
		expect(badTime.status()).toBe(400)
		await api.ok('saveReminder', { time: '07:30' })

		viewOf(await setup(), 'done')
		const me = await api.ok('getMe')
		expect(me).toMatchObject({ setupStep: null, reminderTime: '07:30' })
		const today = await api.ok('getToday')
		expect(today.checkIn.step).toBe('done')
	})

	await test.step('each step saved its Event once', async () => {
		const user = await db.user.findFirstOrThrow({
			where: { email },
			include: { events: true, promises: true }
		})
		const count = (name: string) => user.events.filter((event) => event.name === name).length
		for (const name of [
			'signed_up',
			'plan_generated',
			'plan_confirmed',
			'lesson_taught',
			'promise_committed',
			'reminder_added',
			'setup_finished'
		]) {
			expect(count(name), name).toBe(1)
		}
		expect(user.promises).toHaveLength(1)
		expect(user.promises[0]).toMatchObject({ wording: 'walk for 5 minutes', size: 'small' })
	})

	await test.step('without a token, setup is a 401', async () => {
		const response = await request.get(endpoints.getSetup.path)
		expect(response.status()).toBe(401)
	})
})
