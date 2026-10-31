import assert from 'node:assert/strict'
import { test } from 'node:test'
import { goalAnswer, nextGoalQuestion } from './goal.ts'

const empty = { text: null, weeks: null, startingPoint: null, obstacle: null }

test('the questions come in order: goal, weeks, where you are, what gets in the way', () => {
	assert.equal(nextGoalQuestion(null), 'text')
	assert.equal(nextGoalQuestion(empty), 'text')
	assert.equal(nextGoalQuestion({ ...empty, text: 'run 5k' }), 'weeks')
	assert.equal(nextGoalQuestion({ ...empty, text: 'run 5k', weeks: 8 }), 'startingPoint')
	assert.equal(
		nextGoalQuestion({ text: 'run 5k', weeks: 8, startingPoint: '1 km', obstacle: null }),
		'obstacle'
	)
	assert.equal(
		nextGoalQuestion({ text: 'run 5k', weeks: 8, startingPoint: '1 km', obstacle: 'tired' }),
		null
	)
})

test('someone who left after question 2 comes back on question 3', () => {
	assert.equal(nextGoalQuestion({ ...empty, text: 'run 5k', weeks: 8 }), 'startingPoint')
})

test('a written answer is trimmed and must say something', () => {
	assert.deepEqual(goalAnswer.parse({ question: 'text', answer: '  run 5k  ' }), {
		question: 'text',
		answer: 'run 5k'
	})
	assert.equal(goalAnswer.safeParse({ question: 'obstacle', answer: '   ' }).success, false)
})

test('a written answer fits the column it is saved in', () => {
	assert.equal(goalAnswer.safeParse({ question: 'text', answer: 'x'.repeat(280) }).success, true)
	assert.equal(goalAnswer.safeParse({ question: 'text', answer: 'x'.repeat(281) }).success, false)
})

test('weeks is 4, 8 or 12, sent from a form as text', () => {
	assert.deepEqual(goalAnswer.parse({ question: 'weeks', answer: '8' }), {
		question: 'weeks',
		answer: 8
	})
	for (const answer of ['6', '0', 'eight', '', '8.5']) {
		assert.equal(goalAnswer.safeParse({ question: 'weeks', answer }).success, false, answer)
	}
})

test('an unknown question is refused', () => {
	assert.equal(goalAnswer.safeParse({ question: 'userId', answer: 'x' }).success, false)
})
