import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { trackAiCall } from '@/server/lib/ai-usage/sink'
import type { TrackedModel } from '@/server/lib/ai-usage/models'
import type { AiUsageMeta } from '@/server/lib/ai-usage/track'

// **This file is the reference pattern, and that is its main job.** It exists
// so that an agent or a developer setting up a new project from this template
// can see exactly where the provider client gets wrapped and what a call site
// is supposed to look like, instead of inferring a layering from prose and
// inventing a different one per repo.
//
// Concretely, it is the only file allowed to import the Anthropic SDK,
// enforced by no-restricted-imports in eslint.config.mjs. Same shape as
// src/components/ui/icons.tsx: one file owns the dependency, everything else
// imports the wrapper. Feature code never touches the SDK and never calls
// trackAiCall, so a call that isn't costed is not something anyone has to
// remember — it's a lint error.
//
// Anthropic is this project's only provider. A second one gets its own copy
// of this file, same shape. See docs/rules/ai-usage.md.

// Reads ANTHROPIC_API_KEY from the environment. Constructing it without one
// is fine; only a request fails, so a build or preview with no key still boots.
const anthropic = new Anthropic()

type MessageParams = Anthropic.MessageCreateParamsNonStreaming
type Message = Anthropic.Message
type MessageStream = ReturnType<typeof anthropic.messages.stream>

/**
 * What the spend is for. `feature` is the axis every cost question gets asked
 * along, so it is worth a moment's thought: `offer_copy` and
 * `offer_copy_retry` answer different questions, `generate` answers none.
 *
 * `meta` takes ids, enums and booleans only — brand_id, campaign_id, user_id.
 * Never prompt or completion text. A dashboard may read the `ai_usage` table
 * directly, so that constraint is the only thing keeping this column safe to share.
 */
export type AiContext = {
	feature: string
	model: TrackedModel
	meta?: AiUsageMeta
}

/**
 * A tracked `messages.create`. Returns the SDK's own response untouched and
 * rethrows its errors untouched, so it drops into a call site with no other
 * change.
 *
 * ```ts
 * const message = await createMessage(
 *   { feature: 'offer_copy', model: 'claude-opus-5', meta: { brand_id: brandId } },
 *   { max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }
 * )
 * ```
 *
 * `model` is deliberately not part of the params: it is passed once and used
 * for both the SDK call and the usage row, so the two can never disagree
 * about which model was billed.
 */
export function createMessage(
	context: AiContext,
	params: Omit<MessageParams, 'model'>
): Promise<Message> {
	return trackAiCall({ provider: 'anthropic', ...context }, () =>
		anthropic.messages.create({ ...params, model: context.model })
	)
}

/**
 * A tracked stream. The stream reaches the caller immediately; usage is
 * recorded when it finishes, from the accumulated final message.
 *
 * ```ts
 * const stream = streamMessage(
 *   { feature: 'offer_copy', model: 'claude-opus-5' },
 *   { max_tokens: 4096, messages }
 * )
 * return new Response(stream.toReadableStream())
 * ```
 */
export function streamMessage(
	context: AiContext,
	params: Omit<MessageParams, 'model'>
): MessageStream {
	const stream = anthropic.messages.stream({ ...params, model: context.model })
	// Not awaited on purpose: the caller gets the stream now, and finalMessage()
	// resolves once it has been consumed. `void` because a rejection here is
	// the caller's to handle through the stream, not this function's to swallow
	// twice — trackAiCall has already recorded the attempt either way.
	void trackAiCall({ provider: 'anthropic', ...context }, () => stream.finalMessage())
	return stream
}
