import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generatedPlanSchema, planActionEdit, planStatusOf } from './plan.ts'
import { SARA_GENERATED_PLAN } from './sara-plan.ts'

const eightWeeks = generatedPlanSchema({ weeks: 8 })

test("Sara's plan from the walkthrough is a valid plan", () => {
	assert.equal(eightWeeks.safeParse(SARA_GENERATED_PLAN).success, true)
})

test('a plan needs 2 to 4 milestones and 3 to 5 actions', () => {
	const [first] = SARA_GENERATED_PLAN.milestones
	assert.equal(eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, milestones: [first] }).success, false)
	const actions = SARA_GENERATED_PLAN.actions.slice(0, 2)
	assert.equal(eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, actions }).success, false)
})

test('every action has all three sizes', () => {
	const [first, ...rest] = SARA_GENERATED_PLAN.actions
	const actions = [{ small: first.small, medium: first.medium }, ...rest]
	assert.equal(eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, actions }).success, false)
})

test('a plan has exactly 5 key ideas, each with 3 choices and one right one', () => {
	const keyIdeas = SARA_GENERATED_PLAN.keyIdeas.slice(0, 4)
	assert.equal(eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, keyIdeas }).success, false)

	const [first, ...rest] = SARA_GENERATED_PLAN.keyIdeas
	const twoChoices = [{ ...first, choices: first.choices.slice(0, 2) }, ...rest]
	assert.equal(
		eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, keyIdeas: twoChoices }).success,
		false
	)
	const outOfRange = [{ ...first, correctChoice: 3 }, ...rest]
	assert.equal(
		eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, keyIdeas: outOfRange }).success,
		false
	)
})

test('milestones run in order and fit inside the weeks the user gave', () => {
	const [a, b, c] = SARA_GENERATED_PLAN.milestones
	assert.equal(
		eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, milestones: [b, a, c] }).success,
		false
	)
	const tooLate = [a, b, { ...c, week: 9 }]
	assert.equal(eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, milestones: tooLate }).success, false)
})

test('anything Gemini adds beyond the shape is refused', () => {
	assert.equal(eightWeeks.safeParse({ ...SARA_GENERATED_PLAN, advice: 'eat less' }).success, false)
})

test('goal saved means every goal screen is answered', () => {
	const answered = { text: 'run 5k', weeks: 8, startingPoint: 'I can jog 1 km', obstacle: 'tired' }
	assert.equal(planStatusOf({ goal: null }), 'no_goal')
	assert.equal(planStatusOf({ goal: { ...answered, obstacle: null }, plan: null }), 'no_goal')
	assert.equal(planStatusOf({ goal: { ...answered, weeks: null }, plan: null }), 'no_goal')
	assert.equal(planStatusOf({ goal: answered, plan: null }), 'goal_saved')
	assert.equal(planStatusOf({ goal: answered, plan: { confirmedAt: null } }), 'plan_made')
	assert.equal(planStatusOf({ goal: answered, plan: { confirmedAt: new Date() } }), 'confirmed')
})

const actionId = '0195f0c2-7b1a-7c3e-9a1b-2c3d4e5f6a7b'
const sizes = { small: 'Walk 10 minutes', medium: 'Walk 20 minutes', large: 'Run 1 km' }

test('an action edit is trimmed and saved with all three sizes', () => {
	const parsed = planActionEdit.parse({
		intent: 'save',
		actionId,
		sizes: { ...sizes, small: '  Walk 10 minutes  ' }
	})
	assert.deepEqual(parsed, { intent: 'save', actionId, sizes })
})

test('an action edit refuses an empty or over-long size, or a missing one', () => {
	const edit = (changed: object) => ({ intent: 'save', actionId, sizes: { ...sizes, ...changed } })
	assert.equal(planActionEdit.safeParse(edit({ medium: '   ' })).success, false)
	assert.equal(planActionEdit.safeParse(edit({ large: 'x'.repeat(161) })).success, false)
	assert.equal(planActionEdit.safeParse(edit({ large: null })).success, false)
})

test('removing an action needs only its id, and the id must be a real one', () => {
	assert.equal(planActionEdit.safeParse({ intent: 'remove', actionId }).success, true)
	assert.equal(
		planActionEdit.safeParse({ intent: 'remove', actionId: 'stub-action-0' }).success,
		false
	)
	assert.equal(planActionEdit.safeParse({ intent: 'delete', actionId }).success, false)
})
