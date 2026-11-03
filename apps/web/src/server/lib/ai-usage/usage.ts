import { z } from 'zod'
import type { TokenCounts } from './pricing'
import type { AiCallStatus, AiProvider } from './models'

// Reads token counts, the served model id, the request id and a refusal
// signal out of a raw provider response. Zod rather than hand-rolled
// narrowing so an unexpected response shape degrades to "no usage recorded"
// instead of throwing inside the tracking path (docs/rules/code-style.md:
// every external contract is parsed, never assumed).
//
// **The trap this file exists to contain:** providers disagree on whether
// the prompt-token count already includes cached tokens, and on whether the
// completion count already includes reasoning tokens. OpenRouter, the only
// provider here, reports usage in OpenAI's Chat Completions shape for every
// model it serves, with OpenAI's meanings (OpenRouter's usage page names the
// fields without restating them):
//
//   prompt_tokens       INCLUDES prompt_tokens_details.cached_tokens. Subtract them.
//   completion_tokens   INCLUDES completion_tokens_details.reasoning_tokens. Leave it.
//
// prompt_tokens_details.cache_write_tokens only appears for models with
// explicit caching and a write price; none is called here, so cache writes
// are 0, and a model that has one needs this extractor checked first.
// Anthropic's own API counts input without the cache instead, and Gemini's
// leaves thinking out of its output count.
// Answer both questions from the provider's own docs before adding an
// extractor for one (see docs/rules/ai-usage.md). Get this wrong and the totals are plausible,
// self-consistent, and wrong, which is the hardest kind of wrong to notice.

export type ExtractedUsage = {
	model?: string
	requestId?: string
	status?: AiCallStatus
	tokens: TokenCounts
}

export type UsageExtractor = (response: unknown) => ExtractedUsage | undefined

const count = z
	.number()
	.nullish()
	.transform((value) => value ?? 0)

const NO_TOKENS: TokenCounts = {
	inputTokens: 0,
	outputTokens: 0,
	cacheWriteTokens: 0,
	cacheReadTokens: 0
}

const openRouterCompletion = z.object({
	id: z.string().optional(),
	model: z.string().optional(),
	choices: z.array(
		z.object({
			finish_reason: z.string().nullish(),
			message: z.object({ refusal: z.string().nullish() }).nullish()
		})
	),
	usage: z.object({
		prompt_tokens: count,
		completion_tokens: count,
		prompt_tokens_details: z.object({ cached_tokens: count }).nullish()
	})
})

// A moderated model's input is checked before the model sees it; flagged
// input comes back as a 403 with the reasons instead of a completion.
export const openRouterFlagged = z.object({
	error: z.object({
		code: z.literal(403),
		metadata: z.object({ reasons: z.array(z.string()) })
	})
})

const EXTRACTORS: Record<AiProvider, UsageExtractor> = {
	openrouter: (response) => {
		if (openRouterFlagged.safeParse(response).success) {
			return { status: 'refusal', tokens: NO_TOKENS }
		}
		const parsed = openRouterCompletion.safeParse(response)
		if (!parsed.success) return undefined
		const { id, model, choices, usage } = parsed.data
		const choice = choices[0]
		const isRefusal = choice?.message?.refusal != null || choice?.finish_reason === 'content_filter'
		const cached = usage.prompt_tokens_details?.cached_tokens ?? 0
		return {
			model,
			requestId: id,
			status: isRefusal ? 'refusal' : 'ok',
			tokens: {
				inputTokens: usage.prompt_tokens - cached,
				outputTokens: usage.completion_tokens,
				cacheWriteTokens: 0,
				cacheReadTokens: cached
			}
		}
	}
}

export function extractUsage(provider: AiProvider, response: unknown): ExtractedUsage | undefined {
	return EXTRACTORS[provider](response)
}
