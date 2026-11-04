import { z } from 'zod'
import { SETUP_STEPS } from './limits.ts'

// Who is signed in, and how far through setup they are.

export const setupStep = z.enum(SETUP_STEPS)

export const meResponse = z.object({
	user: z.object({ id: z.uuid(), email: z.string().nullable() }),
	/** The first setup screen not yet finished, null once setup is done. */
	setupStep: setupStep.nullable(),
	/** The daily check-in reminder, "HH:MM" in their own time zone; null until setup picks it. */
	reminderTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d$/)
		.nullable()
})
export type MeResponse = z.infer<typeof meResponse>

/**
 * Saves the person's account row on first sign-in, from the app as the web's
 * sign-in does. `timeZone` is the phone's (an IANA name); it is saved only for
 * a new account, never changed after (GLOSSARY.md, "Kept day").
 */
export const provisionInput = z.object({ timeZone: z.string().max(100).nullable() })
