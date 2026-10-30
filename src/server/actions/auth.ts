'use server'

import { cookies, headers } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { isAuthRetryableFetchError } from '@/lib/supabase/auth-only'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { AppError } from '@/lib/errors/app-error'
import { resolveTimeZone } from '@/lib/kept-day'
import { captureError } from '@/lib/observability/capture-error'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { retryAuthCall, signUpOnce } from '@/server/auth/auth-retry'
import { provisionOrSignOut } from '@/server/auth/provision-or-sign-out'
import { provisionUser } from '@/server/auth/provision-user'
import { START_EMAIL_COOKIE, START_EMAIL_MAX_AGE_SECONDS } from '@/server/auth/start-email'
import { validatedAction } from './validated-action'

// Email and password sign-up, sign-in and sign-out (docs/product/walkthrough.md:
// no email verification, no social sign-in, 30-day sessions). Supabase owns
// the session; the User row is ours, created on first sign-up or sign-in.

const MIN_PASSWORD_LENGTH = 8

// Vercel sets this from the visitor's IP. It stands in when the browser sends no
// time zone, as it does when the form is submitted before the page's JavaScript runs.
const REQUEST_TIME_ZONE_HEADER = 'x-vercel-ip-timezone'

const credentials = z.object({
	email: z.email().trim().toLowerCase(),
	password: z.string().min(MIN_PASSWORD_LENGTH),
	// From the browser, so it can be missing or wrong. That falls back rather
	// than failing: a bad time zone must never stop someone signing up.
	timeZone: z.unknown().transform((value) => resolveTimeZone(value))
})

export interface AuthFormState {
	readonly error: string | null
	readonly email: string
}

type AuthErrors = Awaited<ReturnType<typeof getTranslations>>

// Supabase's error codes for the failures a person can fix themself. Anything
// else is ours, and validatedAction reports it.
function userFacingAuthError(code: string | undefined, t: AuthErrors): AppError | null {
	switch (code) {
		case 'user_already_exists':
		case 'email_exists':
			return new AppError(t('taken'), { status: 409, code })
		case 'invalid_credentials':
			return new AppError(t('wrong'), { status: 401, code })
		case 'weak_password':
			return new AppError(t('password'), { status: 400, code })
		case 'email_not_confirmed':
			return new AppError(t('confirm'), { status: 403, code })
		case 'over_request_rate_limit':
		case 'over_email_send_rate_limit':
			return new AppError(t('busy'), { status: 429, code })
		default:
			return null
	}
}

function readCredentials(formData: FormData, t: AuthErrors, requestTimeZone: string | null) {
	const raw = {
		email: formData.get('email'),
		password: formData.get('password'),
		timeZone: resolveTimeZone(formData.get('timeZone'), requestTimeZone)
	}
	const email = typeof raw.email === 'string' ? raw.email : ''
	const parsed = credentials.safeParse(raw)
	if (parsed.success) return { email, data: parsed.data, error: null }
	const field = parsed.error.issues[0]?.path[0]
	return { email, data: null, error: field === 'password' ? t('password') : t('email') }
}

const createAccount = validatedAction({
	input: credentials,
	handler: async ({ email, password, timeZone }) => {
		const t = await getTranslations('Auth.errors')
		const supabase = await createServerSupabaseClient()
		const { data, error } = await signUpOnce({
			signUp: () => supabase.auth.signUp({ email, password }),
			signIn: () => supabase.auth.signInWithPassword({ email, password }),
			isRetryable: isAuthRetryableFetchError
		})
		if (error != null) throw userFacingAuthError(error.code, t) ?? error
		if (data.user == null) throw new Error('Supabase signUp returned no user and no error')
		// "Confirm email" is meant to be off for Kept. If it's on, there's no
		// session yet, and the person has to confirm before they can sign in.
		if (data.session == null) throw new AppError(t('confirm'), { status: 403 })
		const userId = data.user.id
		await provisionOrSignOut({
			provision: () => provisionUser({ id: userId, email, timeZone }),
			signOut: () => closeSession(supabase)
		})
	}
})

const openSession = validatedAction({
	input: credentials,
	handler: async ({ email, password, timeZone }) => {
		const t = await getTranslations('Auth.errors')
		const supabase = await createServerSupabaseClient()
		const { data, error } = await retryAuthCall(
			() => supabase.auth.signInWithPassword({ email, password }),
			{ isRetryable: isAuthRetryableFetchError }
		)
		if (error != null) throw userFacingAuthError(error.code, t) ?? error
		// Idempotent: covers an account made before its User row existed. An
		// existing row keeps the time zone it already has.
		await provisionOrSignOut({
			provision: () => provisionUser({ id: data.user.id, email, timeZone }),
			signOut: () => closeSession(supabase)
		})
	}
})

async function closeSession(
	supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<void> {
	const { error } = await retryAuthCall(() => supabase.auth.signOut(), {
		isRetryable: isAuthRetryableFetchError
	})
	if (error != null) throw error
}

async function submit(run: typeof createAccount, formData: FormData): Promise<AuthFormState> {
	const t = await getTranslations('Auth.errors')
	const requestTimeZone = (await headers()).get(REQUEST_TIME_ZONE_HEADER)
	const { email, data, error } = readCredentials(formData, t, requestTimeZone)
	if (data == null) return { error, email }

	const result = await run(data)
	if (!result.ok) return { error: result.status >= 500 ? t('failed') : result.error, email }

	const cookieStore = await cookies()
	cookieStore.delete(START_EMAIL_COOKIE)
	return redirect({ href: '/today', locale: await getLocale() })
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
	return submit(createAccount, formData)
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
	return submit(openSession, formData)
}

export async function signOut(): Promise<void> {
	try {
		const supabase = await createServerSupabaseClient()
		const { error } = await supabase.auth.signOut()
		if (error != null) captureError(error)
	} catch (error) {
		// Never throw past a Server Action (docs/rules/error-handling.md). The
		// person still lands on the home page; a stale cookie expires on its own.
		captureError(error)
	}
	redirect({ href: '/', locale: await getLocale() })
}

// The home page's closing sentence ("Sign me up as ___ and start."). The
// email waits for the sign-up form in a short-lived cookie (start-email.ts).
export async function startSignUp(formData: FormData): Promise<void> {
	const parsed = credentials.shape.email.safeParse(formData.get('email'))
	if (parsed.success) {
		const cookieStore = await cookies()
		cookieStore.set(START_EMAIL_COOKIE, parsed.data, {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: START_EMAIL_MAX_AGE_SECONDS,
			path: '/'
		})
	}
	redirect({ href: '/sign-up', locale: await getLocale() })
}
