import type { z } from 'zod'
import type { Endpoint, ErrorBody, ErrorCode } from '@kept/contract'
import { AppError } from '@/lib/errors/app-error'
import type { SignedInUser } from '@/server/auth/session'

// The steps every /api/app/v1 route runs, in order, so none can be skipped
// (src/server/api/app-route.ts wires the real dependencies in):
//
//   1. auth: a `user` endpoint resolves the bearer token first — 401 without one
//   2. input: the query string and JSON body parsed with the contract (400)
//   3. the handler, with the verified user and the parsed input
//   4. output: parsed with the contract's response schema BEFORE it is sent.
//      A handler returning the wrong shape is a bug: 500, reported, and the
//      app opens its error state. A malformed 200 is never sent.
//
// Kept free of `server-only` so the node:test suite can drive it directly.

type Output<S> = S extends z.ZodType ? z.output<S> : undefined

export type AppRouteInput<E extends Endpoint> = {
	user: E['auth'] extends 'user' ? SignedInUser : null
	query: Output<E['query']>
	body: Output<E['body']>
}

export type AppRouteHandler<E extends Endpoint> = (
	input: AppRouteInput<E>
) => Promise<z.input<E['response']>>

export type AppRouteDeps = {
	resolveUser: (authorization: string | null) => Promise<SignedInUser | null>
	/** Reports an unexpected error and returns what the caller may be told. */
	reportUnexpected: (error: unknown) => void
}

// Read once per request, never cached by a CDN or the app's HTTP layer.
const NO_STORE = { 'Cache-Control': 'no-store' }

const STATUS_CODES: Record<number, ErrorCode> = {
	400: 'invalid_request',
	401: 'unauthorized',
	403: 'forbidden',
	404: 'not_found',
	409: 'conflict'
}

const GENERIC_MESSAGE = 'Something went wrong on our side. Try again in a moment.'

function errorResponse(status: number, code: ErrorCode, message: string): Response {
	const body: ErrorBody = { error: { code, message } }
	return Response.json(body, { status, headers: NO_STORE })
}

async function readBody(req: Request): Promise<unknown> {
	const text = await req.text()
	if (text === '') return undefined
	return JSON.parse(text)
}

export function buildAppRoute<E extends Endpoint>(
	endpoint: E,
	handler: AppRouteHandler<E>,
	deps: AppRouteDeps
): (req: Request) => Promise<Response> {
	return async (req) => {
		try {
			let user: SignedInUser | null = null
			if (endpoint.auth === 'user') {
				user = await deps.resolveUser(req.headers.get('authorization'))
				if (user == null) {
					return errorResponse(401, 'unauthorized', 'Your session has ended. Sign in again.')
				}
			}

			const query = endpoint.query?.safeParse(Object.fromEntries(new URL(req.url).searchParams))
			if (query != null && !query.success) {
				return errorResponse(400, 'invalid_request', 'That request was not understood.')
			}
			let rawBody: unknown
			try {
				rawBody = endpoint.body == null ? undefined : await readBody(req)
			} catch {
				return errorResponse(400, 'invalid_request', 'That request was not understood.')
			}
			const body = endpoint.body?.safeParse(rawBody)
			if (body != null && !body.success) {
				return errorResponse(400, 'invalid_request', 'That request was not understood.')
			}

			const result = await handler({
				user,
				query: query?.data,
				body: body?.data
			} as AppRouteInput<E>)

			const output = endpoint.response.safeParse(result)
			if (!output.success) {
				deps.reportUnexpected(
					new Error(`${endpoint.method} ${endpoint.path} answered outside its contract`, {
						cause: output.error
					})
				)
				return errorResponse(500, 'internal', GENERIC_MESSAGE)
			}
			return Response.json(output.data, { status: endpoint.status, headers: NO_STORE })
		} catch (error) {
			// An AppError is the person's doing and carries its own message
			// (docs/rules/error-handling.md); anything else is a bug.
			if (error instanceof AppError) {
				return errorResponse(
					error.status,
					STATUS_CODES[error.status] ?? 'invalid_request',
					error.userMessage
				)
			}
			deps.reportUnexpected(error)
			return errorResponse(500, 'internal', GENERIC_MESSAGE)
		}
	}
}
