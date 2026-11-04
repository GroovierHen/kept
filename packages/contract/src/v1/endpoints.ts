import type { z } from 'zod'
import {
	lessonDone,
	promiseChange,
	promiseChoice,
	recallAnswer,
	recallResult,
	reportSubmission,
	saved
} from './check-in.ts'
import { ledgerResponse } from './ledger.ts'
import { meResponse, provisionInput } from './me.ts'
import {
	firstKeyIdeaInput,
	goalAnswerInput,
	planActionEdit,
	planBuildResult,
	planEditResult,
	reminderInput,
	setupResponse
} from './setup.ts'
import { todayResponse } from './today.ts'

// Every /api/app/v1 route, once: its method, path, who may call it, and the
// schemas for what goes in and what comes back. The web builds each route
// from its entry (apps/web/src/server/api/app-route.ts); the mobile app's API
// client (apps/mobile/src/lib/api.ts) calls routes by name and parses every
// response with the same schemas. A change here that one side doesn't follow
// fails that side's typecheck.

export type Endpoint = {
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
	path: `/api/app/v1/${string}`
	/** `user`: a Supabase access token as `Authorization: Bearer …`. */
	auth: 'user' | 'public'
	query?: z.ZodType
	body?: z.ZodType
	response: z.ZodType
	status: 200 | 201
}

export const endpoints = {
	getMe: { method: 'GET', path: '/api/app/v1/me', auth: 'user', response: meResponse, status: 200 },
	provisionMe: {
		method: 'POST',
		path: '/api/app/v1/me',
		auth: 'user',
		body: provisionInput,
		response: meResponse,
		status: 200
	},
	getToday: {
		method: 'GET',
		path: '/api/app/v1/today',
		auth: 'user',
		response: todayResponse,
		status: 200
	},
	getLedger: {
		method: 'GET',
		path: '/api/app/v1/ledger',
		auth: 'user',
		response: ledgerResponse,
		status: 200
	},
	// The Check-in's writes. Each answers once the change is saved; the app then
	// reads Today again, which says what comes next.
	submitReport: {
		method: 'POST',
		path: '/api/app/v1/today/report',
		auth: 'user',
		body: reportSubmission,
		response: saved,
		status: 200
	},
	answerRecall: {
		method: 'POST',
		path: '/api/app/v1/today/recall',
		auth: 'user',
		body: recallAnswer,
		response: recallResult,
		status: 200
	},
	finishLesson: {
		method: 'POST',
		path: '/api/app/v1/today/lesson',
		auth: 'user',
		body: lessonDone,
		response: saved,
		status: 200
	},
	commitPromise: {
		method: 'POST',
		path: '/api/app/v1/today/promise',
		auth: 'user',
		body: promiseChoice,
		response: saved,
		status: 200
	},
	changePromise: {
		method: 'POST',
		path: '/api/app/v1/today/promise-change',
		auth: 'user',
		body: promiseChange,
		response: saved,
		status: 200
	},
	// Setup's screens and writes. Each write answers once saved; the app then
	// reads setup again, which says what comes next.
	getSetup: {
		method: 'GET',
		path: '/api/app/v1/setup',
		auth: 'user',
		response: setupResponse,
		status: 200
	},
	saveGoalAnswer: {
		method: 'POST',
		path: '/api/app/v1/setup/goal',
		auth: 'user',
		body: goalAnswerInput,
		response: saved,
		status: 200
	},
	buildPlan: {
		method: 'POST',
		path: '/api/app/v1/setup/plan',
		auth: 'user',
		response: planBuildResult,
		status: 200
	},
	rebuildPlan: {
		method: 'POST',
		path: '/api/app/v1/setup/plan/rebuild',
		auth: 'user',
		response: planBuildResult,
		status: 200
	},
	editPlanAction: {
		method: 'POST',
		path: '/api/app/v1/setup/plan/action',
		auth: 'user',
		body: planActionEdit,
		response: planEditResult,
		status: 200
	},
	confirmPlan: {
		method: 'POST',
		path: '/api/app/v1/setup/plan/confirm',
		auth: 'user',
		response: saved,
		status: 200
	},
	learnFirstKeyIdea: {
		method: 'POST',
		path: '/api/app/v1/setup/key-idea',
		auth: 'user',
		body: firstKeyIdeaInput,
		response: saved,
		status: 200
	},
	commitFirstPromise: {
		method: 'POST',
		path: '/api/app/v1/setup/promise',
		auth: 'user',
		body: promiseChoice,
		response: saved,
		status: 200
	},
	saveReminder: {
		method: 'POST',
		path: '/api/app/v1/setup/reminder',
		auth: 'user',
		body: reminderInput,
		response: saved,
		status: 200
	}
} as const satisfies Record<string, Endpoint>

export type Endpoints = typeof endpoints
export type EndpointName = keyof Endpoints
export type ResponseOf<N extends EndpointName> = z.output<Endpoints[N]['response']>
