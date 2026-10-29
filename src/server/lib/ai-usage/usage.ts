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
// completion count already includes reasoning tokens. Anthropic, the only
// provider here:
//
//   input_tokens   EXCLUDES both cache figures. Add all four.
//   output_tokens  INCLUDES thinking. Nothing to add.
//
// OpenAI and Google both include cached tokens in their prompt count, and
// Google leaves thinking out of its output count. Answer both questions from
// the provider's own docs before adding an extractor for one (see
// docs/rules/ai-usage.md). Get this wrong and the totals are plausible,
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

const anthropicResponse = z.object({
	id: z.string().optional(),
	model: z.string().optional(),
	stop_reason: z.string().nullish(),
	usage: z.object({
		input_tokens: count,
		output_tokens: count,
		cache_creation_input_tokens: count,
		cache_read_input_tokens: count
	})
})

const EXTRACTORS: Record<AiProvider, UsageExtractor> = {
	anthropic: (response) => {
		const parsed = anthropicResponse.safeParse(response)
		if (!parsed.success) return undefined
		const { id, model, stop_reason: stopReason, usage } = parsed.data
		return {
			model,
			requestId: id,
			status: stopReason === 'refusal' ? 'refusal' : 'ok',
			tokens: {
				inputTokens: usage.input_tokens,
				outputTokens: usage.output_tokens,
				cacheWriteTokens: usage.cache_creation_input_tokens,
				cacheReadTokens: usage.cache_read_input_tokens
			}
		}
	}
}

export function extractUsage(provider: AiProvider, response: unknown): ExtractedUsage | undefined {
	return EXTRACTORS[provider](response)
}
