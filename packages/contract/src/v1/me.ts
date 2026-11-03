import { z } from 'zod'

// Who is signed in, and how far through setup they are. Setup itself runs on
// the web for now: the app sends anyone with a setup step left there.

export const SETUP_STEPS = ['goal', 'plan', 'keyIdea', 'promise', 'reminder'] as const
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
