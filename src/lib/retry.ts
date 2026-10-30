// Retries for calls that can fail for a moment and then work: a dropped
// database connection, a 503 from Supabase, a rate limited AI call. Only the
// caller knows which errors are worth another try, so isRetryable is required.
// Retry only work that is safe to repeat, because a call that "failed" may
// have succeeded before its answer was lost.

const DEFAULT_ATTEMPTS = 3
// Server Actions answer a person who is waiting, so the defaults keep the whole
// retry under about two seconds.
const DEFAULT_BASE_DELAY_MS = 200
const DEFAULT_MAX_DELAY_MS = 1500

export interface RetryOptions {
	readonly isRetryable: (error: unknown) => boolean
	/** Total tries, the first one included. */
	readonly attempts?: number
	readonly baseDelayMs?: number
	readonly maxDelayMs?: number
	readonly onRetry?: (details: { error: unknown; attempt: number; delayMs: number }) => void
	readonly sleep?: (ms: number) => Promise<void>
	readonly random?: () => number
}

/**
 * Full jitter: a random wait between zero and a cap that doubles each attempt,
 * so many clients failing together don't all retry at the same moment.
 */
export function backoffDelay({
	attempt,
	baseDelayMs,
	maxDelayMs,
	random = Math.random
}: {
	attempt: number
	baseDelayMs: number
	maxDelayMs: number
	random?: () => number
}): number {
	const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
	return Math.round(cap * random())
}

export async function withRetry<Result>(
	run: (attempt: number) => Promise<Result>,
	{
		isRetryable,
		attempts = DEFAULT_ATTEMPTS,
		baseDelayMs = DEFAULT_BASE_DELAY_MS,
		maxDelayMs = DEFAULT_MAX_DELAY_MS,
		onRetry,
		sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
		random
	}: RetryOptions
): Promise<Result> {
	for (let attempt = 1; ; attempt += 1) {
		try {
			return await run(attempt)
		} catch (error) {
			if (attempt >= attempts || !isRetryable(error)) throw error
			const delayMs = backoffDelay({ attempt, baseDelayMs, maxDelayMs, random })
			onRetry?.({ error, attempt, delayMs })
			await sleep(delayMs)
		}
	}
}
