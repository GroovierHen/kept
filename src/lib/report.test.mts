import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reportQuestionWording } from './report.ts'

test('the question speaks to the user, in their own Promise’s words', () => {
	assert.equal(reportQuestionWording('walk and jog for 10 minutes'), 'walk and jog for 10 minutes')
	assert.equal(
		reportQuestionWording('put my running shoes by the door'),
		'put your running shoes by the door'
	)
	assert.equal(reportQuestionWording('I will call My mum.'), 'call your mum')
	assert.equal(reportQuestionWording('stretch by myself'), 'stretch by yourself')
	assert.equal(reportQuestionWording('After work, I will run'), 'run')
	assert.equal(reportQuestionWording('Walk 10 minutes'), 'walk 10 minutes')
	assert.equal(reportQuestionWording('NHS app check, then rest'), 'NHS app check, then rest')
})
