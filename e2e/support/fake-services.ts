import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage } from 'node:http'
import { z } from 'zod'
import { SARA_GENERATED_PLAN } from '../../src/lib/learn/sara-plan'

// Stands in for Supabase Auth and Gemini, the two outside services on Day 1. The
// app reaches them on the server, where a browser test can't intercept, and CI
// has no credentials for either. They are found through their normal base URLs,
// so the app runs its real code with no test-only branch. Only what Day 1 calls
// is here, and anything else fails the test with a 404.

const SESSION_SECONDS = 3600

const signUpBody = z.object({ email: z.string() })
const tokenClaims = z.object({ sub: z.string(), email: z.string() })

const toBase64Url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

function authUser({ id, email }: { id: string; email: string }) {
	return {
		id,
		email,
		aud: 'authenticated',
		role: 'authenticated',
		app_metadata: {},
		user_metadata: {},
		created_at: new Date().toISOString()
	}
}

function signUp(body: unknown) {
	const { email } = signUpBody.parse(body)
	const id = randomUUID()
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS
	const claims = { sub: id, email, exp: expiresAt, aud: 'authenticated', role: 'authenticated' }
	return {
		access_token: `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url(claims)}.fake`,
		token_type: 'bearer',
		expires_in: SESSION_SECONDS,
		expires_at: expiresAt,
		refresh_token: 'fake-refresh-token',
		user: authUser({ id, email })
	}
}

// The token says who it is, so nothing needs storing between requests.
function userFromToken(authorization: string | undefined) {
	const claims = authorization?.split('.')[1]
	if (claims == null) return null
	const { sub, email } = tokenClaims.parse(JSON.parse(Buffer.from(claims, 'base64url').toString()))
	return authUser({ id: sub, email })
}

function geminiPlan() {
	const text = JSON.stringify({ isSafe: true, saferGoal: null, plan: SARA_GENERATED_PLAN })
	return {
		candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }],
		usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 }
	}
}

async function readJson(request: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = []
	for await (const chunk of request) chunks.push(chunk)
	return JSON.parse(Buffer.concat(chunks).toString())
}

async function respond(request: IncomingMessage) {
	const { pathname } = new URL(request.url ?? '/', 'http://localhost')
	if (request.method === 'POST' && pathname === '/auth/v1/signup') {
		return signUp(await readJson(request))
	}
	if (request.method === 'GET' && pathname === '/auth/v1/user') {
		return userFromToken(request.headers.authorization)
	}
	if (request.method === 'POST' && pathname.endsWith(':generateContent')) {
		return geminiPlan()
	}
	return null
}

export async function startFakeServices(port: number): Promise<() => Promise<void>> {
	const server = createServer(async (request, response) => {
		const body = await respond(request)
		response.writeHead(body == null ? 404 : 200, { 'content-type': 'application/json' })
		response.end(JSON.stringify(body ?? { message: `No fake for ${request.url}` }))
	})
	await new Promise<void>((resolve) => server.listen(port, resolve))
	return () => new Promise((resolve) => server.close(() => resolve()))
}
