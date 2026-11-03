import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { AuthOnlySupabaseClient } from './auth-only'

// For the mobile app's API (/api/app/v1): it has no cookies, only the access
// token Supabase gave it at sign-in, sent as `Authorization: Bearer …`. This
// client keeps no session of its own; `auth.getUser(token)` asks Supabase Auth
// whether the token is genuine and current. Auth only, like the other
// wrappers here — the return type has no `.from()` (docs/rules/auth.md).
export function createTokenSupabaseClient(): AuthOnlySupabaseClient {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{ auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
	)
}
