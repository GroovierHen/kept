import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	checkInView,
	promiseChoice,
	recallAnswer,
	recallResult,
	reportQuestionWording,
	reportSubmission
} from '../../index.ts'

const ID = '7d5f3a52-3f6f-4a40-9a39-2a0f1b7c9e11'

test('a report needs its ids and one of the three answers', () => {
	const report = { promiseId: ID, reportId: ID, answer: 'partly' }
	assert.equal(reportSubmission.safeParse(report).success, true)
	assert.equal(reportSubmission.safeParse({ ...report, answer: 'maybe' }).success, false)
	assert.equal(reportSubmission.safeParse({ ...report, reportId: 'r1' }).success, false)
})

test('a promise is an action or typed wording, with a moment', () => {
	assert.equal(
		promiseChoice.safeParse({ kind: 'action', moment: 'lunch', actionId: ID }).success,
		true
	)
	const typed = promiseChoice.safeParse({ kind: 'typed', moment: 'wake_up', wording: '  walk  ' })
	assert.equal(typed.success && typed.data.kind === 'typed' && typed.data.wording, 'walk')
	assert.equal(
		promiseChoice.safeParse({ kind: 'typed', moment: 'wake_up', wording: ' ' }).success,
		false
	)
	assert.equal(
		promiseChoice.safeParse({ kind: 'typed', moment: 'wake_up', wording: 'x'.repeat(161) }).success,
		false
	)
	assert.equal(promiseChoice.safeParse({ kind: 'action', actionId: ID }).success, false)
})

test('a recall answer is typed text up to 1000 characters or a choice index', () => {
	assert.equal(recallAnswer.safeParse({ mode: 'typed', keyIdeaId: ID, answer: '' }).success, true)
	assert.equal(
		recallAnswer.safeParse({ mode: 'typed', keyIdeaId: ID, answer: 'x'.repeat(1001) }).success,
		false
	)
	assert.equal(recallAnswer.safeParse({ mode: 'choice', keyIdeaId: ID, choice: 2 }).success, true)
	assert.equal(
		recallAnswer.safeParse({ mode: 'choice', keyIdeaId: ID, choice: '2' }).success,
		false
	)
})

test('a recall result is a mark, multiple choice, or moved on', () => {
	const graded = {
		kind: 'graded',
		score: 1,
		reason: 'r',
		modelAnswer: 'm',
		isMultipleChoice: false
	}
	assert.equal(recallResult.safeParse(graded).success, true)
	assert.equal(recallResult.safeParse({ ...graded, score: 3 }).success, false)
	assert.equal(recallResult.safeParse({ kind: 'choosing' }).success, true)
})

test('each step carries what its screen needs', () => {
	const picker = { actions: [{ id: 'a1', wording: 'walk' }], initial: null }
	for (const view of [
		{ step: 'report', promiseId: 'p1', when: 'yesterday' },
		{ step: 'learn', recall: null, lesson: { keyIdeaId: 'k', title: 't', lesson: 'l' } },
		{ step: 'commit', picker, nudge: 'typeSmaller', hasCurrent: true },
		{ step: 'done', change: { ...picker, promiseId: 'p1' }, learned: null }
	]) {
		assert.equal(checkInView.safeParse(view).success, true, view.step)
	}
	assert.equal(checkInView.safeParse({ step: 'commit', picker, nudge: null }).success, false)
})

test('the report question turns the promise into second person', () => {
	assert.equal(reportQuestionWording("After work, I'll walk my dog."), 'walk your dog')
	assert.equal(reportQuestionWording('Put my shoes out'), 'put your shoes out')
})
