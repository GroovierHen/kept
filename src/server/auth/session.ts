import 'server-only'
import { isAuthRetryableFetchError } from '@/lib/supabase/auth-only'
import { captureError } from '@/lib/observability/capture-error'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { retryAuthCall } from './auth-retry'

// Who is signed in, or null. Fails closed: if Supabase can't be reached the
// visitor is treated as signed out, which only ever shows them a sign-in form.
export interface SignedInUser {
	readonly id: string
	readonly email: string | null
}

export async function getSignedInUser(): Promise<SignedInUser | null> {
	try {
		const supabase = await createServerSupabaseClient()
		// A blip would otherwise look like being signed out and send a signed-in
		// person to the sign-in form.
		const { data } = await retryAuthCall(() => supabase.auth.getUser(), {
			isRetryable: isAuthRetryableFetchError
		})
		if (data.user == null) return null
		return { id: data.user.id, email: data.user.email ?? null }
	} catch (error) {
		captureError(error)
		return null
	}
}
