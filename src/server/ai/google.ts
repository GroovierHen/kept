import 'server-only'
import {
	GoogleGenAI,
	type GenerateContentParameters,
	type GenerateContentResponse
} from '@google/genai'
import { env } from '@/lib/env'
import { trackAiCall } from '@/server/lib/ai-usage/sink'
import type { TrackedModel } from '@/server/lib/ai-usage/models'
import type { AiUsageMeta } from '@/server/lib/ai-usage/track'

// The only file allowed to import the Gemini SDK, enforced by
// no-restricted-imports in eslint.config.mjs, and the only caller of
// trackAiCall. Feature code calls generateContent here, so a call that isn't
// costed is a lint error rather than something to remember. Google is this
// project's only provider; a second one gets its own copy of this file, same
// shape. See docs/rules/ai-usage.md.

// Every call has a person waiting on it, so the SDK's own retries are kept
// short: 3 tries with exponential backoff and jitter on rate limits and
// server errors, then the caller shows a message. Its defaults (5 tries, up
// to 60s apart) suit a background job, not a setup screen.
const REQUEST_TIMEOUT_MS = 20_000
const RETRY_OPTIONS = {
	attempts: 3,
	initialDelay: 0.5,
	maxDelay: 4,
	httpStatusCodes: [408, 429, 500, 502, 503, 504]
}

// Built on first use: a build or preview without GEMINI_API_KEY boots, and
// only an AI call fails.
let client: GoogleGenAI | null = null

function gemini(): GoogleGenAI {
	client ??= new GoogleGenAI({
		apiKey: env.GEMINI_API_KEY,
		httpOptions: { timeout: REQUEST_TIMEOUT_MS, retryOptions: RETRY_OPTIONS }
	})
	return client
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

/**
 * A tracked `models.generateContent`. Returns the SDK's own response and
 * rethrows its errors untouched.
 *
 * ```ts
 * const response = await generateContent(
 *   { feature: 'goal_plan', model: 'gemini-3.5-flash-lite', meta: { user_id: userId } },
 *   { contents: prompt, config: { responseMimeType: 'application/json' } }
 * )
 * ```
 *
 * `model` is passed once and used for both the call and the usage row, so
 * the two can never disagree about which model was billed.
 */
export function generateContent(
	context: AiContext,
	params: Omit<GenerateContentParameters, 'model'>
): Promise<GenerateContentResponse> {
	return trackAiCall({ provider: 'google', ...context }, () =>
		gemini().models.generateContent({ ...params, model: context.model })
	)
}
