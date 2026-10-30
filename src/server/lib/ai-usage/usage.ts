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
// completion count already includes reasoning tokens. Google, the only
// provider here (GenerateContentResponseUsageMetadata in @google/genai):
//
//   promptTokenCount      INCLUDES cached tokens. Subtract them from input.
//   toolUsePromptTokenCount  separate, billed as input. Add it.
//   candidatesTokenCount  EXCLUDES thinking. Add thoughtsTokenCount.
//
// Gemini's caching has no write charge, so cache writes are 0. Anthropic's
// input_tokens excludes cache instead, and OpenAI's prompt count includes it.
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

// A block on the prompt, or an answer stopped for safety, is a refusal.
const REFUSAL_FINISH_REASONS = new Set([
	'SAFETY',
	'PROHIBITED_CONTENT',
	'BLOCKLIST',
	'SPII',
	'IMAGE_SAFETY'
])

const googleResponse = z.object({
	responseId: z.string().optional(),
	modelVersion: z.string().optional(),
	promptFeedback: z.object({ blockReason: z.string().nullish() }).nullish(),
	candidates: z.array(z.object({ finishReason: z.string().nullish() })).nullish(),
	usageMetadata: z.object({
		promptTokenCount: count,
		cachedContentTokenCount: count,
		toolUsePromptTokenCount: count,
		candidatesTokenCount: count,
		thoughtsTokenCount: count
	})
})

const EXTRACTORS: Record<AiProvider, UsageExtractor> = {
	google: (response) => {
		const parsed = googleResponse.safeParse(response)
		if (!parsed.success) return undefined
		const {
			responseId,
			modelVersion,
			promptFeedback,
			candidates,
			usageMetadata: usage
		} = parsed.data
		const finishReason = candidates?.[0]?.finishReason
		const isRefusal =
			promptFeedback?.blockReason != null ||
			(finishReason != null && REFUSAL_FINISH_REASONS.has(finishReason))
		return {
			model: modelVersion,
			requestId: responseId,
			status: isRefusal ? 'refusal' : 'ok',
			tokens: {
				inputTokens:
					usage.promptTokenCount - usage.cachedContentTokenCount + usage.toolUsePromptTokenCount,
				outputTokens: usage.candidatesTokenCount + usage.thoughtsTokenCount,
				cacheWriteTokens: 0,
				cacheReadTokens: usage.cachedContentTokenCount
			}
		}
	}
}

export function extractUsage(provider: AiProvider, response: unknown): ExtractedUsage | undefined {
	return EXTRACTORS[provider](response)
}
