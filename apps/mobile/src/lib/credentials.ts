import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@kept/contract'
import type { SignUpResult } from './supabase'

export type SignUpFailure =
	Extract<SignUpResult, { ok: false }>['reason'] | 'email' | 'password' | 'passwordLong'

// Something@something.something: Supabase checks it properly.
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** What the sign-up form can say before anything is sent: the limits the web form checks. */
export function credentialProblem(email: string, password: string): SignUpFailure | null {
	if (!LOOKS_LIKE_EMAIL.test(email) || email.length > MAX_EMAIL_LENGTH) return 'email'
	if (password.length < MIN_PASSWORD_LENGTH) return 'password'
	if (password.length > MAX_PASSWORD_LENGTH) return 'passwordLong'
	return null
}
