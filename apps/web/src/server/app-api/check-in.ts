import 'server-only'
import type { endpoints, RecallResult } from '@kept/contract'
import { captureError } from '@/lib/observability/capture-error'
import type { AppRouteHandler } from '@/server/api/app-handler'
import { gradeChoice, gradeRecall, type RecallOutcome } from '@/server/learn/grade-recall'
import { changePromise as savePromiseChange } from '@/server/today/change-promise'
import { commitNextPromise } from '@/server/today/commit-next-promise'
import { finishTodaysLesson } from '@/server/today/finish-lesson'
import { makeReport } from '@/server/today/make-report'
import { requireSetUp } from './require-set-up'

// The Check-in's writes for the app, each the same function the web's server
// action calls (src/server/actions/today.ts, learn.ts). Each answers once the
// change is saved; the app then reads Today again for what comes next.

const SAVED = { ok: true } as const

export const submitReport: AppRouteHandler<typeof endpoints.submitReport> = async ({
	user,
	body
}) => {
	await requireSetUp(user.id)
	await makeReport({ userId: user.id, ...body })
	return SAVED
}

export const answerRecall: AppRouteHandler<typeof endpoints.answerRecall> = async ({
	user,
	body
}) => {
	await requireSetUp(user.id)
	const outcome =
		body.mode === 'typed'
			? await gradeRecall(user.id, body.keyIdeaId, body.answer)
			: await gradeChoice(user.id, body.keyIdeaId, body.choice)
	return recallResultOf(outcome)
}

export const finishLesson: AppRouteHandler<typeof endpoints.finishLesson> = async ({
	user,
	body
}) => {
	await requireSetUp(user.id)
	await finishTodaysLesson({ userId: user.id, keyIdeaId: body.keyIdeaId })
	return SAVED
}

export const commitPromise: AppRouteHandler<typeof endpoints.commitPromise> = async ({
	user,
	body
}) => {
	await requireSetUp(user.id)
	await commitNextPromise({ userId: user.id, choice: body })
	return SAVED
}

export const changePromise: AppRouteHandler<typeof endpoints.changePromise> = async ({
	user,
	body
}) => {
	await requireSetUp(user.id)
	await savePromiseChange({ userId: user.id, ...body })
	return SAVED
}

/** The web's RecallState, as the app reads it (src/server/actions/learn.ts). */
function recallResultOf(outcome: RecallOutcome): RecallResult {
	if (outcome.kind === 'graded') return { kind: 'graded', ...outcome.grade }
	if (outcome.kind === 'not_due') return { kind: 'moved_on' }
	// The AI couldn't mark it: worth knowing about, but the person just gets choices.
	if (outcome.error != null) captureError(outcome.error)
	return { kind: 'choosing' }
}
