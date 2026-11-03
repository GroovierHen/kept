import { test } from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'
import { errorBodySchema, type Endpoint } from '@kept/contract'
import { AppError } from '@/lib/errors/app-error'
import { buildAppRoute, type AppRouteDeps } from './app-handler.ts'

const USER = { id: '6f1c1f4e-8a3b-4d55-9b1e-2f0d3c9a7b10', email: 'a@example.com' }

const echo = {
	method: 'POST',
	path: '/api/app/v1/echo',
	auth: 'user',
	query: z.object({ loud: z.enum(['yes', 'no']).optional() }),
	body: z.object({ word: z.string().min(1) }),
	response: z.object({ said: z.string() }),
	status: 201
} as const satisfies Endpoint

function deps(overrides: Partial<AppRouteDeps> = {}) {
	const reported: unknown[] = []
	return {
		reported,
		deps: {
			resolveUser: async (header: string | null) => (header === 'Bearer good' ? USER : null),
			reportUnexpected: (error: unknown) => {
				reported.push(error)
			},
			...overrides
		} satisfies AppRouteDeps
	}
}

function request(body: unknown, { token = 'good', query = '' } = {}) {
	return new Request(`https://kept.test/api/app/v1/echo${query}`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}` },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	})
}

async function errorOf(response: Response) {
	return errorBodySchema.parse(await response.json()).error
}

test('a valid request reaches the handler with the user and the parsed input', async () => {
	const { deps: d } = deps()
	const route = buildAppRoute(
		echo,
		async ({ user, query, body }) => ({
			said: `${user.id}:${body.word}:${query.loud ?? 'no'}`
		}),
		d
	)
	const response = await route(request({ word: 'hi' }, { query: '?loud=yes' }))
	assert.equal(response.status, 201)
	assert.equal(response.headers.get('cache-control'), 'no-store')
	assert.deepEqual(await response.json(), { said: `${USER.id}:hi:yes` })
})

test('a missing or rejected token is a 401 and never reaches the handler', async () => {
	const { deps: d } = deps()
	let called = false
	const route = buildAppRoute(
		echo,
		async () => {
			called = true
			return { said: '' }
		},
		d
	)
	const response = await route(request({ word: 'hi' }, { token: 'forged' }))
	assert.equal(response.status, 401)
	assert.equal((await errorOf(response)).code, 'unauthorized')
	assert.equal(called, false)
})

test('a body or query outside the contract is a 400', async () => {
	const { deps: d } = deps()
	const route = buildAppRoute(echo, async () => ({ said: '' }), d)
	for (const req of [
		request({ word: '' }),
		request('{not json'),
		request({ word: 'hi' }, { query: '?loud=maybe' })
	]) {
		const response = await route(req)
		assert.equal(response.status, 400)
		assert.equal((await errorOf(response)).code, 'invalid_request')
	}
})

test('a handler answering outside the contract is a reported 500, never a malformed 200', async () => {
	const { deps: d, reported } = deps()
	const route = buildAppRoute(echo, async () => ({ said: 42 }) as unknown as { said: string }, d)
	const response = await route(request({ word: 'hi' }))
	assert.equal(response.status, 500)
	assert.equal((await errorOf(response)).code, 'internal')
	assert.equal(reported.length, 1)
})

test('an AppError carries its own message and status; anything else is reported', async () => {
	const { deps: d, reported } = deps()
	const expected = buildAppRoute(
		echo,
		async () => {
			throw new AppError('Finish setting up first.', { status: 404 })
		},
		d
	)
	const notFound = await expected(request({ word: 'hi' }))
	assert.equal(notFound.status, 404)
	assert.deepEqual(await errorOf(notFound), {
		code: 'not_found',
		message: 'Finish setting up first.'
	})
	assert.equal(reported.length, 0)

	const crash = buildAppRoute(
		echo,
		async () => {
			throw new Error('database password is hunter2')
		},
		d
	)
	const failed = await crash(request({ word: 'hi' }))
	assert.equal(failed.status, 500)
	assert.doesNotMatch((await errorOf(failed)).message, /hunter2/)
	assert.equal(reported.length, 1)
})
