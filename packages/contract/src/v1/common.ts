import { z } from 'zod'

// What every /api/app/v1 route answers with when it doesn't succeed. The
// message is written for the person using the app; the code is for the app's
// logic. Never a stack trace or a raw database error (docs/rules/error-handling.md).

export const ERROR_CODES = [
	'unauthorized',
	'invalid_request',
	'forbidden',
	'not_found',
	/** The thing changed under the request: a report window closed, a plan locked. */
	'conflict',
	'internal'
] as const
export const errorCode = z.enum(ERROR_CODES)
export type ErrorCode = z.infer<typeof errorCode>

export const errorBodySchema = z.object({
	error: z.object({ code: errorCode, message: z.string() })
})
export type ErrorBody = z.infer<typeof errorBodySchema>

/** A Kept day (GLOSSARY.md): a calendar date in the person's own time zone. */
export const keptDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** When in the day a Promise is kept (GLOSSARY.md). */
export const PROMISE_MOMENTS = ['wake_up', 'lunch', 'after_work', 'before_bed'] as const
