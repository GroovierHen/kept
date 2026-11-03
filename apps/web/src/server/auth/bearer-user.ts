import 'server-only'
import { isAuthRetryableFetchError } from '@/lib/supabase/auth-only'
import { createTokenSupabaseClient } from '@/lib/supabase/token'
import { retryAuthCall } from './auth-retry'
import type { SignedInUser } from './session'

const BEARER = /^Bearer\s+(\S+)$/i

/**
 * The person a mobile request's `Authorization: Bearer <access token>` belongs
 * to, or null for a missing, expired or forged token. Unlike the cookie
 * session, a Supabase outage here throws: the app shows "try again", never a
 * sign-in screen to someone who is signed in.
 */
export async function getBearerUser(authorization: string | null): Promise<SignedInUser | null> {
	const token = authorization?.match(BEARER)?.[1]
	if (token == null) return null
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
	const supabase = createTokenSupabaseClient()
	const { data, error } = await retryAuthCall(() => supabase.auth.getUser(token), {
		isRetryable: isAuthRetryableFetchError
	})
	if (error != null && isAuthRetryableFetchError(error)) throw error
	if (data.user == null) return null
	return { id: data.user.id, email: data.user.email ?? null }
}
