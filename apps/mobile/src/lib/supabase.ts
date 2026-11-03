import { createClient, isAuthRetryableFetchError, type SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'
import { env } from './env'
import { log } from './logger'

/**
 * Supabase on the phone is sign-in and nothing else (docs/rules/auth.md).
 * Every byte of Kept's data comes through the web app's API (lib/api.ts),
 * which checks the session's access token on each request. The client is
 * typed to its auth surface, so `.from()` and `.rpc()` are type errors, and
 * this is the only file that may import `@supabase/*` (ESLint enforces it).
 */
export type AuthOnlySupabaseClient = Pick<SupabaseClient, 'auth'>

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

/** False until both values are set; sign-in then says it isn't set up rather than failing. */
export const isSupabaseEnabled = SUPABASE_URL !== '' && SUPABASE_KEY !== ''

if (!isSupabaseEnabled) {
	log.warn('Supabase is not configured; sign-in is off. See apps/mobile/README.md.')
}

// createClient needs a URL and a key to construct at all; unconfigured, it
// gets inert ones and the isSupabaseEnabled checks keep every call away.
export const supabase: AuthOnlySupabaseClient = createClient(
	SUPABASE_URL || 'https://not-configured.invalid',
	SUPABASE_KEY || 'not-configured',
	{
		auth: {
			storage: AsyncStorage,
			autoRefreshToken: isSupabaseEnabled,
			persistSession: isSupabaseEnabled,
			detectSessionInUrl: false
		}
	}
)

// Refresh tokens while the app is in the foreground only (Supabase's advice
// for React Native: a background timer is unreliable and wastes battery).
if (isSupabaseEnabled) {
	AppState.addEventListener('change', (state) => {
		if (state === 'active') void supabase.auth.startAutoRefresh()
		else void supabase.auth.stopAutoRefresh()
	})
}

export type AccessToken = { token: string } | { failure: 'signed_out' | 'offline' }

/**
 * The current session's access token, refreshed first if it has expired. A
 * refresh that couldn't reach Supabase is `offline`, never `signed_out`: a
 * dropped connection must not sign anyone out.
 */
export async function currentAccessToken(): Promise<AccessToken> {
	const { data, error } = await supabase.auth.getSession()
	if (data.session?.access_token) return { token: data.session.access_token }
	if (error && isAuthRetryableFetchError(error)) return { failure: 'offline' }
	return { failure: 'signed_out' }
}

/** A new token after the server refused the current one; a refused refresh ends the session. */
export async function refreshedAccessToken(): Promise<AccessToken> {
	const { data, error } = await supabase.auth.refreshSession()
	if (data.session?.access_token) return { token: data.session.access_token }
	if (error && isAuthRetryableFetchError(error)) return { failure: 'offline' }
	return { failure: 'signed_out' }
}

export type SignInResult =
	{ ok: true } | { ok: false; reason: 'not_configured' | 'credentials' | 'offline' | 'other' }

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
	if (!isSupabaseEnabled) return { ok: false, reason: 'not_configured' }
	const { error } = await supabase.auth.signInWithPassword({ email, password })
	if (error == null) return { ok: true }
	if (isAuthRetryableFetchError(error)) return { ok: false, reason: 'offline' }
	if (error.code === 'invalid_credentials') return { ok: false, reason: 'credentials' }
	log.warn('Sign-in failed', { code: error.code ?? null })
	return { ok: false, reason: 'other' }
}

/** Signs out of this device only; the web stays signed in. */
export async function signOut(): Promise<void> {
	const { error } = await supabase.auth.signOut({ scope: 'local' })
	if (error) log.warn('Sign-out did not reach Supabase; the local session is cleared anyway')
}

/** Calls back on every sign-in and sign-out; returns the unsubscribe. */
export function onSessionChange(listener: (signedIn: boolean) => void): () => void {
	const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session != null))
	return () => data.subscription.unsubscribe()
}

export async function hasSession(): Promise<boolean> {
	if (!isSupabaseEnabled) return false
	const { data } = await supabase.auth.getSession()
	return data.session != null
}
