import NetInfo from '@react-native-community/netinfo'
import type { z } from 'zod'
import {
	endpoints,
	errorBodySchema,
	type Endpoint,
	type EndpointName,
	type ErrorCode,
	type ResponseOf
} from '@kept/contract'
import { env } from './env'
import { log } from './logger'
import { isOffline } from './network'
import { currentAccessToken, isSupabaseEnabled, refreshedAccessToken, signOut } from './supabase'

/**
 * The app's one way to its data: a typed fetch over `/api/app/v1`, built from
 * `@kept/contract`'s endpoint map, so a route and its response shape are
 * defined once for the web and the phone.
 *
 *   const today = await api('getToday')
 *
 * - It sends the session's access token as `Authorization: Bearer …`.
 * - It parses every response with the contract. A response that doesn't match
 *   is an error, never a partial result.
 * - It THROWS an ApiError on anything but a 2xx it could parse. A screen shows
 *   the error's message, written for the person (docs/rules/error-handling.md).
 * - A 401 gets one token refresh and one retry; a second refusal means the
 *   session is over, so the app signs out of it on this device.
 */

/** Failures decided on the device, before or instead of a response. */
export type ClientErrorCode =
	| 'not_configured'
	| 'signed_out'
	| 'offline'
	| 'unreachable'
	| 'timeout'
	| 'invalid_response'
	| 'cancelled'

export type ApiErrorCode = ErrorCode | ClientErrorCode

export class ApiError extends Error {
	readonly code: ApiErrorCode
	/** The HTTP status, or null when there was no response. */
	readonly status: number | null

	constructor(code: ApiErrorCode, message: string, status: number | null = null) {
		super(message)
		this.name = 'ApiError'
		this.code = code
		this.status = status
	}
}

const MESSAGES = {
	notConnected: "This version of the app isn't connected to Kept yet.",
	signedOut: "You're signed out. Sign in again to see this.",
	offline: "You're offline. Check your connection, then try again.",
	unreachable: "We couldn't reach Kept. Try again in a moment.",
	timeout: 'That took too long. Check your connection, then try again.',
	ourSide: 'Something went wrong on our side. Try again in a moment.',
	sessionExpired: 'Your session has ended. Sign in again.',
	cancelled: 'The request was cancelled.'
} as const

/** The message to show for any error a screen catches. */
export function errorMessage(error: unknown): string {
	return error instanceof ApiError ? error.message : MESSAGES.ourSide
}

const MAX_RETRIES = 2

/** TanStack Query's `retry`: only what a second try can fix. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
	if (failureCount >= MAX_RETRIES || !(error instanceof ApiError)) return false
	if (error.code === 'timeout' || error.code === 'unreachable') return true
	return error.status != null && error.status >= 500
}

/** Long enough for a slow mobile network; short enough that a spinner never spins forever. */
export const DEFAULT_TIMEOUT_MS = 15_000

type Endpoints = typeof endpoints
type InputOf<S> = S extends z.ZodType ? z.input<S> : never
type QueryPart<E> = E extends { query: infer Q } ? { query: InputOf<Q> } : { query?: undefined }
type BodyPart<E> = E extends { body: infer B } ? { body: InputOf<B> } : { body?: undefined }

export type RequestOptions<N extends EndpointName> = QueryPart<Endpoints[N]> &
	BodyPart<Endpoints[N]> & {
		/** TanStack Query's, so a query it cancels stops its request. */
		signal?: AbortSignal
		timeoutMs?: number
	}

export async function api<N extends EndpointName>(
	name: N,
	...[options]: object extends RequestOptions<N>
		? [options?: RequestOptions<N>]
		: [options: RequestOptions<N>]
): Promise<ResponseOf<N>> {
	const endpoint: Endpoint = endpoints[name]
	const route = `${endpoint.method} ${endpoint.path}`
	const opts: {
		query?: Record<string, unknown>
		body?: unknown
		signal?: AbortSignal
		timeoutMs?: number
	} = options ?? {}

	const siteUrl = env.EXPO_PUBLIC_SITE_URL
	if (siteUrl == null || (endpoint.auth === 'user' && !isSupabaseEnabled)) {
		throw new ApiError('not_configured', MESSAGES.notConnected)
	}

	const search = new URLSearchParams()
	if (endpoint.query != null) {
		const query = endpoint.query.parse(opts.query) as Record<string, unknown>
		for (const [key, value] of Object.entries(query)) {
			if (value != null) search.set(key, String(value))
		}
	}
	const qs = search.toString()
	const url = `${siteUrl.replace(/\/+$/, '')}${endpoint.path}${qs ? `?${qs}` : ''}`
	const body = endpoint.body == null ? undefined : JSON.stringify(endpoint.body.parse(opts.body))

	let token: string | undefined
	if (endpoint.auth === 'user') {
		const current = await currentAccessToken()
		if ('failure' in current) {
			throw current.failure === 'offline'
				? new ApiError('offline', MESSAGES.offline)
				: new ApiError('signed_out', MESSAGES.signedOut)
		}
		token = current.token
	}

	const send = (bearer: string | undefined) =>
		sendOnce({
			url,
			method: endpoint.method,
			body,
			bearer,
			outer: opts.signal,
			timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
		})

	let res = await send(token)
	if (res.status === 401 && endpoint.auth === 'user') {
		const fresh = await refreshedAccessToken()
		if ('failure' in fresh && fresh.failure === 'offline') {
			throw new ApiError('offline', MESSAGES.offline)
		}
		if ('token' in fresh && fresh.token !== token) res = await send(fresh.token)
		if (res.status === 401 || 'failure' in fresh) {
			await signOut()
			throw new ApiError('unauthorized', MESSAGES.sessionExpired, 401)
		}
	}

	if (!res.ok) throw await errorFrom(res)

	let json: unknown
	try {
		json = await res.json()
	} catch {
		// A wrong EXPO_PUBLIC_SITE_URL can answer 200 with a web page.
		log.error('API answered a success that is not JSON', { route, status: res.status })
		throw new ApiError('invalid_response', MESSAGES.ourSide, res.status)
	}
	const parsed = endpoint.response.safeParse(json)
	if (!parsed.success) {
		log.error('API response failed its contract', {
			route,
			issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
		})
		throw new ApiError('invalid_response', MESSAGES.ourSide, res.status)
	}
	return parsed.data as ResponseOf<N>
}

async function sendOnce({
	url,
	method,
	body,
	bearer,
	outer,
	timeoutMs
}: {
	url: string
	method: Endpoint['method']
	body: string | undefined
	bearer: string | undefined
	outer: AbortSignal | undefined
	timeoutMs: number
}): Promise<Response> {
	if (outer?.aborted) throw new ApiError('cancelled', MESSAGES.cancelled)
	const controller = new AbortController()
	let timedOut = false
	const timer = setTimeout(() => {
		timedOut = true
		controller.abort()
	}, timeoutMs)
	const cancel = () => controller.abort()
	outer?.addEventListener('abort', cancel)

	const headers: Record<string, string> = { Accept: 'application/json' }
	if (bearer) headers.Authorization = `Bearer ${bearer}`
	if (body !== undefined) headers['Content-Type'] = 'application/json'

	try {
		return await fetch(url, { method, headers, body, signal: controller.signal })
	} catch {
		if (timedOut) throw new ApiError('timeout', MESSAGES.timeout)
		if (outer?.aborted) throw new ApiError('cancelled', MESSAGES.cancelled)
		// fetch rejects the same way for no network and for a server that didn't
		// answer; the device's own connection state tells them apart.
		throw (await deviceIsOffline())
			? new ApiError('offline', MESSAGES.offline)
			: new ApiError('unreachable', MESSAGES.unreachable)
	} finally {
		clearTimeout(timer)
		outer?.removeEventListener('abort', cancel)
	}
}

async function deviceIsOffline(): Promise<boolean> {
	try {
		return isOffline(await NetInfo.fetch())
	} catch {
		return false
	}
}

// Every v1 error is `{ error: { code, message } }`, its message written for
// the person. Anything else (a proxy's page) gets a plain message by status.
async function errorFrom(res: Response): Promise<ApiError> {
	const raw: unknown = await res.json().catch(() => null)
	const parsed = errorBodySchema.safeParse(raw)
	if (parsed.success)
		return new ApiError(parsed.data.error.code, parsed.data.error.message, res.status)
	if (res.status === 401) return new ApiError('unauthorized', MESSAGES.sessionExpired, 401)
	return new ApiError(
		res.status >= 500 ? 'internal' : 'invalid_request',
		MESSAGES.ourSide,
		res.status
	)
}
