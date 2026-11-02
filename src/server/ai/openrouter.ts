import 'server-only'
import { z } from 'zod'
import { env } from '@/lib/env'
import { withRetry } from '@/lib/retry'
import { trackAiCall } from '@/server/lib/ai-usage/sink'
import type { TrackedModel } from '@/server/lib/ai-usage/models'
import type { AiUsageMeta } from '@/server/lib/ai-usage/track'
import { openRouterFlagged } from '@/server/lib/ai-usage/usage'

// The only file that calls an AI provider, and the only caller of
// trackAiCall. There is no SDK: OpenRouter's settings (provider rules,
// reasoning) aren't in any SDK's types, so this is plain fetch with every
// response parsed by Zod. ESLint stops any other file importing an AI SDK or
// naming openrouter.ai, so a call that isn't costed is a lint error rather
// than something to remember. See docs/rules/ai-usage.md and docs/adr/0003.

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'

// Every call has a person waiting on it. A plan takes about 10s, so 45s
// covers a slow host, and one retry covers a blip: OpenRouter already moves a
// failed request to another host inside a single call.
const REQUEST_TIMEOUT_MS = 45_000
const TRIES = 2
const RETRY_BASE_DELAY_MS = 500
const RETRY_MAX_DELAY_MS = 4000
const RETRY_STATUSES = new Set([408, 429, 500, 502, 503, 504])

/** An answer from OpenRouter that wasn't a completion. */
export class OpenRouterError extends Error {
	readonly status: number

	constructor(status: number, message: string) {
		super(message)
		this.name = 'OpenRouterError'
		this.status = status
	}
}

function isRetryable(error: unknown): boolean {
	if (error instanceof OpenRouterError) return RETRY_STATUSES.has(error.status)
	// fetch's own network failure, and the timeout's abort.
	return (
		error instanceof TypeError ||
		(error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name))
	)
}

/**
 * What the spend is for. `feature` is the axis every cost question gets asked
 * along: `goal_plan` and `goal_plan_retry` answer different questions.
 *
 * `meta` takes ids, enums and booleans only. Never prompt or completion text:
 * a dashboard may read the `ai_usage` table directly.
 */
export type AiContext = {
	feature: string
	model: TrackedModel
	meta?: AiUsageMeta
}

export type ChatParams = {
	messages: readonly { role: 'user'; content: string }[]
	/** A JSON Schema the reply must match, enforced by the host. */
	jsonSchema?: { name: string; schema: unknown }
}

/** The model's text, or that moderation stopped the input before the model saw it. */
export type ChatReply = { kind: 'message'; text: string | undefined } | { kind: 'flagged' }

const completion = z.object({
	choices: z.array(z.object({ message: z.object({ content: z.string().nullish() }) })).min(1)
})

function requestBody({ model, params }: { model: TrackedModel; params: ChatParams }) {
	return {
		model,
		messages: params.messages,
		// Off until a case shows a call needs it: it passed every benchmark
		// case without, 4-5s a plan faster (docs/adr/0003).
		reasoning: { enabled: false },
		// Testers are told no host keeps their answers, and every host must
		// honour every setting sent, the JSON Schema included.
		provider: { data_collection: 'deny', require_parameters: true },
		...(params.jsonSchema != null && {
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: params.jsonSchema.name,
					strict: true,
					schema: params.jsonSchema.schema
				}
			}
		})
	}
}

// Returns the raw body, a completion or a moderation flag, for the usage row
// to read; anything else throws.
async function send({
	model,
	params
}: {
	model: TrackedModel
	params: ChatParams
}): Promise<unknown> {
	if (env.OPENROUTER_API_KEY == null) throw new Error('OPENROUTER_API_KEY is not set')
	const baseUrl = env.OPENROUTER_BASE_URL === '' ? undefined : env.OPENROUTER_BASE_URL
	const response = await fetch(`${baseUrl ?? DEFAULT_BASE_URL}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestBody({ model, params })),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	})
	const body: unknown = await response.json().catch(() => null)
	if (openRouterFlagged.safeParse(body).success) return body
	if (!response.ok) {
		throw new OpenRouterError(response.status, `OpenRouter answered ${response.status}`)
	}
	// A host can fail after OpenRouter has answered 200; that comes back with
	// no choices, and is worth the same retry as a 502.
	if (!completion.safeParse(body).success) {
		throw new OpenRouterError(502, 'OpenRouter answered 200 without a completion')
	}
	return body
}

/**
 * A tracked chat completion. Returns the model's text, or `flagged` when
 * moderation stopped the input; throws on anything else, after one retry.
 *
 * ```ts
 * const reply = await chatCompletion(
 *   { feature: 'goal_plan', model: 'openai/gpt-6-luna', meta: { user_id: userId } },
 *   { messages: [{ role: 'user', content: prompt }] }
 * )
 * ```
 *
 * `model` is passed once and used for both the call and the usage row, so
 * the two can never disagree about which model was billed.
 */
export async function chatCompletion(context: AiContext, params: ChatParams): Promise<ChatReply> {
	const body = await trackAiCall({ provider: 'openrouter', ...context }, () =>
		withRetry(() => send({ model: context.model, params }), {
			isRetryable,
			attempts: TRIES,
			baseDelayMs: RETRY_BASE_DELAY_MS,
			maxDelayMs: RETRY_MAX_DELAY_MS
		})
	)
	const parsed = completion.safeParse(body)
	if (!parsed.success) return { kind: 'flagged' }
	return { kind: 'message', text: parsed.data.choices[0]?.message.content ?? undefined }
}
