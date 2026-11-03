import { test } from 'node:test'
import assert from 'node:assert/strict'
import { costMicroUsd, type OpenRouterRates } from './pricing'
import { openRouterSlug } from './models'
import { extractUsage } from './usage'
import { buildRow, createAiTracker, type AiCallSpec, type AiUsageRow } from './track'

// Real rates, copied from OpenRouter's catalogue. Using invented round
// numbers would let a units bug (per-token vs. per-million) pass every
// assertion here and still be off by six orders of magnitude in production.
const OPUS: OpenRouterRates = {
	prompt: '0.000005',
	completion: '0.000025',
	input_cache_read: '0.0000005',
	input_cache_write: '0.00000625'
}

const LONG_CONTEXT: OpenRouterRates = {
	prompt: '0.0000025',
	completion: '0.000015',
	input_cache_read: '0.00000025',
	overrides: [
		{
			min_prompt_tokens: 272_000,
			prompt: '0.000005',
			completion: '0.0000225',
			input_cache_read: '0.0000005'
		}
	]
}

const NO_TOKENS = {
	inputTokens: 0,
	outputTokens: 0,
	cacheWriteTokens: 0,
	cacheReadTokens: 0
}

// --- the model map ---------------------------------------------------------

test('maps a known model and leaves an unknown one unpriced', () => {
	assert.equal(openRouterSlug('openai/gpt-6-luna'), 'openai/gpt-6-luna')
	assert.equal(openRouterSlug('openai/gpt-6-luna-20260922'), 'openai/gpt-6-luna')
	assert.equal(openRouterSlug('openai/gpt-9-nova'), null)
})

test('batch is a separate upstream entry, fast is not', () => {
	assert.equal(openRouterSlug('openai/gpt-6-luna', 'batch'), 'openai/gpt-6-luna:batch')
	assert.equal(openRouterSlug('openai/gpt-6-luna', 'fast'), 'openai/gpt-6-luna')
})

// --- pricing ---------------------------------------------------------------

test('prices all four token buckets at their own rate', () => {
	const cost = costMicroUsd(
		{ inputTokens: 1000, outputTokens: 500, cacheWriteTokens: 200, cacheReadTokens: 10_000 },
		OPUS
	)
	// 0.005 + 0.0125 + 0.00125 + 0.005 = 0.02375 USD
	assert.equal(cost, 23_750)
})

test('an unmapped model prices as null, never as zero', () => {
	assert.equal(costMicroUsd({ ...NO_TOKENS, inputTokens: 1000 }, undefined), null)
})

test('a long-context call is priced at the override tier', () => {
	const below = costMicroUsd({ ...NO_TOKENS, inputTokens: 1000, outputTokens: 100 }, LONG_CONTEXT)
	assert.equal(below, 4000)

	const above = costMicroUsd(
		{ ...NO_TOKENS, inputTokens: 300_000, outputTokens: 100 },
		LONG_CONTEXT
	)
	assert.equal(above, 1_502_250)
})

test('cached tokens count toward the long-context threshold', () => {
	// 100 fresh tokens, but a 300k context — the provider charges for the
	// window, not for what changed in it.
	const cost = costMicroUsd(
		{ ...NO_TOKENS, inputTokens: 100, cacheReadTokens: 300_000 },
		LONG_CONTEXT
	)
	assert.equal(cost, 150_500)
})

test('an override leaves the rates it does not declare alone', () => {
	const promptOnly: OpenRouterRates = {
		prompt: '0.0000025',
		completion: '0.000015',
		overrides: [{ min_prompt_tokens: 272_000, prompt: '0.000005' }]
	}
	const cost = costMicroUsd({ ...NO_TOKENS, inputTokens: 300_000, outputTokens: 100 }, promptOnly)
	// Prompt doubles, completion stays at the base rate: 1.5 + 0.0015
	assert.equal(cost, 1_501_500)
})

// --- provider response extraction ------------------------------------------

// OpenRouter reports usage in OpenAI's shape: prompt_tokens INCLUDES the
// cached tokens in prompt_tokens_details, and completion_tokens INCLUDES the
// reasoning tokens in completion_tokens_details. So cached tokens are
// subtracted from input, and reasoning is left in output, where it is billed.
test('openrouter prompt count includes cache, so cached tokens are subtracted', () => {
	const extracted = extractUsage('openrouter', {
		id: 'gen-01abc',
		model: 'openai/gpt-6-luna',
		choices: [{ finish_reason: 'stop', message: { content: '{}' } }],
		usage: {
			prompt_tokens: 11_000,
			completion_tokens: 500,
			total_tokens: 11_500,
			prompt_tokens_details: { cached_tokens: 10_000 },
			completion_tokens_details: { reasoning_tokens: 100 }
		}
	})
	assert.deepEqual(extracted, {
		model: 'openai/gpt-6-luna',
		requestId: 'gen-01abc',
		status: 'ok',
		tokens: {
			inputTokens: 1000,
			outputTokens: 500,
			cacheWriteTokens: 0,
			cacheReadTokens: 10_000
		}
	})
})

test('openrouter counts with no details leave nothing to adjust', () => {
	const extracted = extractUsage('openrouter', {
		choices: [{ finish_reason: 'stop', message: { content: '{}' } }],
		usage: { prompt_tokens: 300, completion_tokens: 80 }
	})
	assert.deepEqual(extracted?.tokens, {
		inputTokens: 300,
		outputTokens: 80,
		cacheWriteTokens: 0,
		cacheReadTokens: 0
	})
})

test('a refusal is recorded as a refusal, not as a plain success', () => {
	const refusedAnswer = extractUsage('openrouter', {
		choices: [{ finish_reason: 'stop', message: { content: null, refusal: 'I can’t help.' } }],
		usage: { prompt_tokens: 10, completion_tokens: 5 }
	})
	assert.equal(refusedAnswer?.status, 'refusal')

	const filteredAnswer = extractUsage('openrouter', {
		choices: [{ finish_reason: 'content_filter', message: { content: '' } }],
		usage: { prompt_tokens: 10, completion_tokens: 0 }
	})
	assert.equal(filteredAnswer?.status, 'refusal')
})

// A moderated model's input is checked before the model sees it, and flagged
// input comes back as a 403 with the reasons, not as a completion. Nothing
// was generated, so nothing is billed.
test('input flagged by moderation is a refusal with no tokens', () => {
	const flagged = extractUsage('openrouter', {
		error: {
			code: 403,
			message: 'openai/gpt-6-luna requires moderation on OpenAI. Your input was flagged.',
			metadata: {
				reasons: ['self-harm'],
				flagged_input: '…',
				provider_name: 'OpenAI',
				model_slug: 'openai/gpt-6-luna'
			}
		}
	})
	assert.deepEqual(flagged, { status: 'refusal', tokens: NO_TOKENS })
})

test('an unrecognised response shape yields no usage rather than throwing', () => {
	assert.equal(extractUsage('openrouter', { unexpected: true }), undefined)
	assert.equal(extractUsage('openrouter', null), undefined)
})

// --- row building ----------------------------------------------------------

const SPEC: AiCallSpec = {
	provider: 'openrouter',
	model: 'openai/gpt-6-luna',
	feature: 'goal_plan'
}

test('the model that served the call wins over the model that was asked for', () => {
	const row = buildRow(
		{ ...SPEC, model: 'openai/gpt-6-luna' },
		{
			model: 'openai/gpt-6-luna-20260922',
			choices: [{ finish_reason: 'stop', message: { content: '{}' } }],
			usage: { prompt_tokens: 1, completion_tokens: 1 }
		},
		{ status: 'ok', latencyMs: 12 }
	)
	assert.equal(row.model, 'openai/gpt-6-luna-20260922')
})

test('a failed call still produces a row, with the requested model and no tokens', () => {
	const row = buildRow(SPEC, undefined, { status: 'error', latencyMs: 12 })
	assert.equal(row.status, 'error')
	assert.equal(row.model, 'openai/gpt-6-luna')
	assert.deepEqual(
		{
			inputTokens: row.inputTokens,
			outputTokens: row.outputTokens,
			cacheWriteTokens: row.cacheWriteTokens,
			cacheReadTokens: row.cacheReadTokens
		},
		NO_TOKENS
	)
})

// --- failure isolation -----------------------------------------------------
// The most important test in this file. Everything else is an accounting
// detail; this is the one that decides whether a broken ledger takes a
// user-facing feature down with it.

test('a sink that throws never breaks the AI call', async () => {
	const trackAiCall = createAiTracker(() => {
		throw new Error('the database is on fire')
	})
	const result = await trackAiCall(SPEC, async () => 'the completion')
	assert.equal(result, 'the completion')
})

test('a broken custom extractor never breaks the AI call either', async () => {
	const rows: AiUsageRow[] = []
	const trackAiCall = createAiTracker((row) => rows.push(row))
	const result = await trackAiCall(
		{
			...SPEC,
			extract: () => {
				throw new Error('this extractor was written on a Friday')
			}
		},
		async () => 'the completion'
	)
	assert.equal(result, 'the completion')
	assert.equal(rows.length, 0)
})

test('a provider error is recorded and then rethrown untouched', async () => {
	const rows: AiUsageRow[] = []
	const trackAiCall = createAiTracker((row) => rows.push(row))
	const boom = new Error('529 overloaded')

	await assert.rejects(
		trackAiCall(SPEC, async () => {
			throw boom
		}),
		(error: unknown) => error === boom
	)
	assert.equal(rows.length, 1)
	assert.equal(rows[0]?.status, 'error')
})
