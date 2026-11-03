import { z } from 'zod'
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/credential-limits'
import { resolveTimeZone } from '@/lib/kept-day'

export const credentials = z.object({
	// Trimmed before the format check: a phone's autocomplete often adds a
	// trailing space, which z.email() alone rejects.
	email: z.string().trim().toLowerCase().pipe(z.email().max(MAX_EMAIL_LENGTH)),
	password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
	// From the browser, so it can be missing or wrong. That falls back rather
	// than failing: a bad time zone must never stop someone signing up.
	timeZone: z.unknown().transform((value) => resolveTimeZone(value))
})
