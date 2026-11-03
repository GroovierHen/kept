import type { z } from 'zod'
import { meResponse } from './me.ts'
import { todayResponse } from './today.ts'

// Every /api/app/v1 route, once: its method, path, who may call it, and the
// schemas for what goes in and what comes back. The web builds each route
// from its entry (apps/web/src/server/api/app-route.ts); the mobile app's API
// client (apps/mobile/lib/api.ts) calls routes by name and parses every
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
	getToday: {
		method: 'GET',
		path: '/api/app/v1/today',
		auth: 'user',
		response: todayResponse,
		status: 200
	}
} as const satisfies Record<string, Endpoint>

export type Endpoints = typeof endpoints
export type EndpointName = keyof Endpoints
export type ResponseOf<N extends EndpointName> = z.output<Endpoints[N]['response']>
