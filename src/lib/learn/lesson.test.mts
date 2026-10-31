import assert from 'node:assert/strict'
import { test } from 'node:test'
import { todaysKeyIdea } from './lesson.ts'

const keptDay = '2026-10-31'
const idea = (id: string, position: number, taughtOn: string | null = null) => ({
	id,
	position,
	taughtOn
})

test('day 1 teaches the first key idea in Gemini order', () => {
	const ideas = [idea('b', 1), idea('a', 0), idea('c', 2)]
	assert.equal(todaysKeyIdea({ ideas, keptDay, dueRecalls: 0 }), 'a')
})

test('the next day teaches the next untaught idea', () => {
	const ideas = [idea('a', 0, '2026-10-30'), idea('b', 1), idea('c', 2)]
	assert.equal(todaysKeyIdea({ ideas, keptDay, dueRecalls: 1 }), 'b')
})

test('an idea taught today stays today’s, so a reload shows the same lesson', () => {
	const ideas = [idea('a', 0, '2026-10-30'), idea('b', 1, keptDay), idea('c', 2)]
	assert.equal(todaysKeyIdea({ ideas, keptDay, dueRecalls: 2 }), 'b')
})

test('a day with 2 recalls due teaches nothing new', () => {
	const ideas = [idea('a', 0, '2026-10-29'), idea('b', 1, '2026-10-30'), idea('c', 2)]
	assert.equal(todaysKeyIdea({ ideas, keptDay, dueRecalls: 2 }), null)
})

test('nothing is left once every idea is taught', () => {
	const ideas = [idea('a', 0, '2026-10-29'), idea('b', 1, '2026-10-30')]
	assert.equal(todaysKeyIdea({ ideas, keptDay, dueRecalls: 0 }), null)
})
