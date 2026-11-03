import { createHash } from 'node:crypto'
import { createServer, type IncomingMessage } from 'node:http'
import { z } from 'zod'
import { SARA_GENERATED_PLAN } from '../../src/lib/learn/sara-plan'

// Stands in for Supabase Auth and OpenRouter, the two outside services on Day 1. The
// app reaches them on the server, where a browser test can't intercept, and CI
// has no credentials for either. They are found through their normal base URLs,
// so the app runs its real code with no test-only branch. Only what the tests
// call is here, and anything else fails the test with a 404.

const SESSION_SECONDS = 3600

const signUpBody = z.object({ email: z.string() })
const refreshBody = z.object({ refresh_token: z.string() })
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

// The same email is always the same user, so the mobile app's password
// sign-in finds the account a web sign-up made. A v4-shaped uuid from a hash.
function userIdFor(email: string): string {
	const hex = createHash('sha256').update(email).digest('hex')
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

// Sign-up, password sign-in and refresh all hand out the same kind of session.
// The password is never checked: there is one person per email here.
function session(email: string) {
	const id = userIdFor(email)
	const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS
	const claims = { sub: id, email, exp: expiresAt, aud: 'authenticated', role: 'authenticated' }
	return {
		access_token: `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url(claims)}.fake`,
		token_type: 'bearer',
		expires_in: SESSION_SECONDS,
		expires_at: expiresAt,
		refresh_token: `fake-refresh.${Buffer.from(email).toString('base64url')}`,
		user: authUser({ id, email })
	}
}

function signUp(body: unknown) {
	return session(signUpBody.parse(body).email)
}

function refresh(body: unknown) {
	const token = refreshBody.parse(body).refresh_token
	return session(Buffer.from(token.replace(/^fake-refresh\./, ''), 'base64url').toString())
}

// The token says who it is, so nothing needs storing between requests.
function userFromToken(authorization: string | undefined) {
	const claims = authorization?.split('.')[1]
	if (claims == null) return null
	const { sub, email } = tokenClaims.parse(JSON.parse(Buffer.from(claims, 'base64url').toString()))
	return authUser({ id: sub, email })
}

export const FAKE_GRADE = {
	score: 1,
	reason: 'You got part of it. Easy runs also build your base.'
}

// The planner and the grader both ask for a chat completion; the prompt says which.
function aiReply(body: unknown) {
	const isGrader = JSON.stringify(body).includes('You are the grader')
	const reply = isGrader ? FAKE_GRADE : { isSafe: true, saferGoal: null, plan: SARA_GENERATED_PLAN }
	return {
		id: 'gen-fake',
		model: 'openai/gpt-6-luna',
		choices: [
			{ finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(reply) } }
		],
		usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
	}
}

async function readJson(request: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = []
	for await (const chunk of request) chunks.push(chunk)
	return JSON.parse(Buffer.concat(chunks).toString())
}

async function respond(request: IncomingMessage) {
	const { pathname, searchParams } = new URL(request.url ?? '/', 'http://localhost')
	if (request.method === 'POST' && pathname === '/auth/v1/signup') {
		return signUp(await readJson(request))
	}
	// The mobile app signs in with a password and refreshes its token.
	if (request.method === 'POST' && pathname === '/auth/v1/token') {
		const grant = searchParams.get('grant_type')
		if (grant === 'password') return signUp(await readJson(request))
		if (grant === 'refresh_token') return refresh(await readJson(request))
	}
	if (request.method === 'POST' && pathname === '/auth/v1/logout') return {}
	if (request.method === 'GET' && pathname === '/auth/v1/user') {
		return userFromToken(request.headers.authorization)
	}
	if (request.method === 'POST' && pathname === '/chat/completions') {
		return aiReply(await readJson(request))
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
