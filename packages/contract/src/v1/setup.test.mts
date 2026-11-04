import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	goalAnswerInput,
	planActionEdit,
	planBuildResult,
	provisionInput,
	reminderInput,
	setupView
} from '../../index.ts'
import { MAX_GOAL_ANSWER_LENGTH, PLAN_WEEKS, SETUP_STEPS } from '../../src/v1/limits.ts'

const ID = '7d5f3a52-3f6f-4a40-9a39-2a0f1b7c9e11'

test('a goal answer is trimmed words up to the limit, or one of the plan lengths', () => {
	const text = goalAnswerInput.safeParse({ question: 'text', answer: '  run 5k ' })
	assert.equal(text.success && text.data.answer, 'run 5k')
	assert.equal(goalAnswerInput.safeParse({ question: 'obstacle', answer: '  ' }).success, false)
	assert.equal(
		goalAnswerInput.safeParse({
			question: 'startingPoint',
			answer: 'x'.repeat(MAX_GOAL_ANSWER_LENGTH + 1)
		}).success,
		false
	)
	for (const weeks of PLAN_WEEKS) {
		assert.equal(goalAnswerInput.safeParse({ question: 'weeks', answer: weeks }).success, true)
	}
	assert.equal(goalAnswerInput.safeParse({ question: 'weeks', answer: 6 }).success, false)
	assert.equal(goalAnswerInput.safeParse({ question: 'weeks', answer: '8' }).success, false)
})

test('an action edit rewords all three sizes, or removes it', () => {
	const sizes = { small: 'a', medium: 'b', large: 'c' }
	assert.equal(planActionEdit.safeParse({ intent: 'save', actionId: ID, sizes }).success, true)
	assert.equal(
		planActionEdit.safeParse({ intent: 'save', actionId: ID, sizes: { ...sizes, large: ' ' } })
			.success,
		false
	)
	assert.equal(planActionEdit.safeParse({ intent: 'remove', actionId: ID }).success, true)
})

test('a reminder is a 24-hour HH:MM time', () => {
	assert.equal(reminderInput.safeParse({ time: '07:30' }).success, true)
	assert.equal(reminderInput.safeParse({ time: '7:30' }).success, false)
	assert.equal(reminderInput.safeParse({ time: '24:00' }).success, false)
})

test('the account is saved with a time zone, or none', () => {
	assert.equal(provisionInput.safeParse({ timeZone: 'Asia/Karachi' }).success, true)
	assert.equal(provisionInput.safeParse({ timeZone: null }).success, true)
	assert.equal(provisionInput.safeParse({}).success, false)
})

test('a plan build says saved, skipped, or why the AI made none', () => {
	assert.equal(planBuildResult.safeParse({ kind: 'unsafe', saferGoal: 'walk' }).success, true)
	assert.equal(planBuildResult.safeParse({ kind: 'unsafe' }).success, false)
	assert.equal(planBuildResult.safeParse({ kind: 'idle' }).success, false)
})

test('each setup step carries what its screen needs', () => {
	const answers = { text: null, weeks: null, startingPoint: null, obstacle: null }
	for (const view of [
		{ step: 'goal', question: 'text', answers },
		{ step: 'plan', plan: { status: 'goal_saved', goalText: 'run', isBuilding: true } },
		{ step: 'keyIdea', lesson: null },
		{ step: 'promise', actions: [{ id: 'a1', wording: 'walk' }] },
		{ step: 'reminder' },
		{ step: 'done' }
	]) {
		assert.equal(setupView.safeParse(view).success, true, view.step)
	}
	assert.equal(setupView.safeParse({ step: 'plan', plan: { status: 'confirmed' } }).success, false)
	assert.deepEqual([...SETUP_STEPS], ['goal', 'plan', 'keyIdea', 'promise', 'reminder'])
})
