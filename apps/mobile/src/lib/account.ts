import { getCalendars } from 'expo-localization'
import type { MeResponse } from '@kept/contract'
import { api } from './api'

// The person's account row is saved once per sign-in, as the web's sign-in
// and sign-up do (apps/web/src/server/actions/auth.ts): the first read of who
// they are on this device saves it, with the phone's time zone for a new
// account. Every read after that is a plain GET.

let isSaved = false

/** Who is signed in, saving their account first if this sign-in hasn't yet. */
export async function readMe(signal?: AbortSignal): Promise<MeResponse> {
	if (isSaved) return api('getMe', { signal })
	const me = await api('provisionMe', { body: { timeZone: phoneTimeZone() }, signal })
	isSaved = true
	return me
}

/** On sign-out, so the next person's first read saves their account. */
export function forgetAccount(): void {
	isSaved = false
}

function phoneTimeZone(): string | null {
	return getCalendars()[0]?.timeZone ?? null
}
