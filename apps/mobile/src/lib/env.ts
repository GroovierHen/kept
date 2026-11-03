import { z } from 'zod'

/**
 * Every environment variable the app reads, in one place. Nothing else in
 * apps/mobile touches `process.env` (ESLint enforces it).
 *
 * 1. Only `EXPO_PUBLIC_*` names: Expo inlines those into the bundle at build
 *    time, and nothing else exists on the phone.
 * 2. Each is read STATICALLY, `process.env.EXPO_PUBLIC_X` spelled out as
 *    below. Expo only inlines a static member access; `process.env[name]`
 *    works in development and is `undefined` in every release build.
 * 3. Nothing secret, ever. Anyone who downloads the app can read these.
 *
 * Unset, blank and `REPLACE_…` all mean "not configured", and the feature
 * that needs the value turns itself off. A malformed value is reported and
 * treated as unset: crashing at launch is worse than running without the one
 * service that is misconfigured.
 */

const url = z.url({ protocol: /^https?$/ })
const key = z.string().min(1)

export const envSchema = z.object({
	EXPO_PUBLIC_SITE_URL: url.optional(),
	EXPO_PUBLIC_SUPABASE_URL: url.optional(),
	EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key.optional(),
	EXPO_PUBLIC_SENTRY_DSN: url.optional(),
	EXPO_PUBLIC_POSTHOG_KEY: key.optional(),
	EXPO_PUBLIC_POSTHOG_HOST: url.default('https://us.i.posthog.com')
})

export type Env = z.infer<typeof envSchema>
export type EnvInput = { [K in keyof Env]?: string }

function configured(value: string | undefined): string | undefined {
	const trimmed = value?.trim()
	return trimmed && !trimmed.startsWith('REPLACE_') ? trimmed : undefined
}

/** Exported for tests; the app uses `env`. Invalid values are dropped, never thrown. */
export function parseEnv(input: EnvInput): { env: Env; invalid: string[] } {
	const raw: Record<string, string | undefined> = Object.fromEntries(
		Object.entries(input).map(([name, value]) => [name, configured(value)])
	)
	const parsed = envSchema.safeParse(raw)
	if (parsed.success) return { env: parsed.data, invalid: [] }
	const invalid = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]
	for (const name of invalid) delete raw[name]
	return { env: envSchema.parse(raw), invalid }
}

// Spelled out one by one, on purpose. See rule 2 above.
const parsed = parseEnv({
	EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL,
	EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
	EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
	EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
	EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST
})

export const env = parsed.env
/** Names that were set but malformed; lib/observability.ts reports them once Sentry is up. */
export const invalidEnvNames = parsed.invalid
