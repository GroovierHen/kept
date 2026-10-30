import assert from 'node:assert/strict'
import { test } from 'node:test'
import { firstUnfinishedStep, SETUP_STEPS, type SetupProgress } from './setup-step.ts'

const nothingDone: SetupProgress = {
	planStatus: 'no_goal',
	hasLearnedFirstIdea: false,
	hasCommittedPromise: false,
	hasAddedReminder: false
}

test('a new user starts at the goal', () => {
	assert.equal(firstUnfinishedStep(nothingDone), 'goal')
})

test('a saved goal or a plan still waiting for Confirm lands on the plan', () => {
	assert.equal(firstUnfinishedStep({ ...nothingDone, planStatus: 'goal_saved' }), 'plan')
	assert.equal(firstUnfinishedStep({ ...nothingDone, planStatus: 'plan_made' }), 'plan')
})

test('after Confirm the steps run key idea, promise, reminder', () => {
	const confirmed: SetupProgress = { ...nothingDone, planStatus: 'confirmed' }
	assert.equal(firstUnfinishedStep(confirmed), 'keyIdea')

	const learned = { ...confirmed, hasLearnedFirstIdea: true }
	assert.equal(firstUnfinishedStep(learned), 'promise')

	const committed = { ...learned, hasCommittedPromise: true }
	assert.equal(firstUnfinishedStep(committed), 'reminder')
})

test('the numbered screens match the order users are sent through them', () => {
	const confirmed: SetupProgress = { ...nothingDone, planStatus: 'confirmed' }
	const learned = { ...confirmed, hasLearnedFirstIdea: true }
	const walked = [
		nothingDone,
		{ ...nothingDone, planStatus: 'goal_saved' as const },
		confirmed,
		learned,
		{ ...learned, hasCommittedPromise: true }
	].map(firstUnfinishedStep)
	assert.deepEqual(walked, [...SETUP_STEPS])
})

test('a finished setup has no step left', () => {
	assert.equal(
		firstUnfinishedStep({
			planStatus: 'confirmed',
			hasLearnedFirstIdea: true,
			hasCommittedPromise: true,
			hasAddedReminder: true
		}),
		null
	)
})

test('a typed promise made while the planner was down still returns to the plan', () => {
	assert.equal(
		firstUnfinishedStep({
			planStatus: 'goal_saved',
			hasLearnedFirstIdea: false,
			hasCommittedPromise: true,
			hasAddedReminder: true
		}),
		'plan'
	)
})
