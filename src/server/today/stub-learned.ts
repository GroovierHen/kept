import 'server-only'
import { cookies } from 'next/headers'
import type { KeptDay } from '@/lib/kept-day'

// TEMPORARY: a cookie stands in for Learn saving that today's card was done,
// until the real card lands (#31, #32). Then delete this file.

const COOKIE_PREFIX = 'kept_today_learned_'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 2

export async function hasLearnedOn({
	userId,
	today
}: {
	userId: string
	today: KeptDay
}): Promise<boolean> {
	const cookieStore = await cookies()
	return cookieStore.get(`${COOKIE_PREFIX}${userId}`)?.value === today
}

export async function saveLearnedOn({
	userId,
	today
}: {
	userId: string
	today: KeptDay
}): Promise<void> {
	const cookieStore = await cookies()
	cookieStore.set(`${COOKIE_PREFIX}${userId}`, today, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: COOKIE_MAX_AGE_SECONDS,
		path: '/'
	})
}
