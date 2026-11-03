import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import expoConfig from 'eslint-config-expo/flat.js'

// The Expo app. Next's configs and Expo's register the same plugins (react,
// react-hooks, import) as different instances, so each is kept to its own
// app's files: Next's skip apps/mobile, Expo's apply only inside it.
const MOBILE = 'apps/mobile'

/** A config object that holds nothing but `ignores` is a global ignore, and must stay one. */
const isGlobalIgnore = (config) =>
	Object.keys(config).every((key) => key === 'ignores' || key === 'name')

const outsideMobile = (configs) =>
	configs.map((config) =>
		isGlobalIgnore(config)
			? config
			: { ...config, ignores: [...(config.ignores ?? []), `${MOBILE}/**`] }
	)

// `**`, not `*` — a single star doesn't cross a `/`, so '@phosphor-icons/*'
// would miss the very path this template itself imports
// ('@phosphor-icons/react/ssr').
const ICON_PROVIDER_IMPORTS = {
	group: [
		'@phosphor-icons/**',
		'lucide-react',
		'@heroicons/**',
		'@radix-ui/react-icons',
		'@tabler/icons-react',
		'react-icons',
		'react-icons/**'
	],
	message:
		"Import icons from '@/components/ui/icons' instead — that file is the only place an icon provider is imported. Add the icon there if it's missing. See docs/rules/icons.md."
}

// Every provider SDK, plus the wrappers that would route around one. An
// import here is an AI call that no ai_usage row will ever account for, which
// is the failure this whole subsystem exists to make impossible rather than
// merely discouraged.
const AI_SDK_IMPORTS = {
	group: [
		'@anthropic-ai/sdk',
		'@anthropic-ai/sdk/**',
		'openai',
		'openai/**',
		'@google/genai',
		'@google/genai/**',
		'@google/generative-ai',
		'/ai',
		'@ai-sdk/**'
	],
	message:
		"Call the provider through 'apps/web/src/server/ai/<provider>' instead — that file is the only place an AI SDK is imported, and the only place trackAiCall is called. Add the method there if it's missing. See docs/rules/ai-usage.md."
}

// The AI provider is called with plain fetch, so there is no SDK import for
// the rule above to catch. Naming its host anywhere but src/server/ai/* is
// the same untracked call by another route.
const AI_HOST_SYNTAX = {
	selector: 'Literal[value=/openrouter\\.ai/], TemplateElement[value.raw=/openrouter\\.ai/]',
	message:
		"Call OpenRouter through 'apps/web/src/server/ai/openrouter.ts' instead — it is the only place trackAiCall is called. See docs/rules/ai-usage.md."
}

const LOGGER_IN_CLIENT_SYNTAX = {
	selector:
		"Program:has(> ExpressionStatement[directive='use client']) ImportDeclaration[source.value=/^@\\/server\\/lib\\/logger(\\/|$)/]",
	message:
		'The logger is server-only; a Client Component reports errors through Sentry (instrumentation-client.ts). See docs/rules/logging.md.'
}

// Prisma is the only data path (docs/rules/database.md). The client is
// constructed once, in src/server/db/client.ts, and everything else imports
// `db` from there. Type imports stay allowed — typing a parameter as
// `AdminRole` is not a second connection. The raw drivers and other ORMs have
// no legitimate importer anywhere in src/.
const DATA_ACCESS_IMPORTS = {
	group: [
		'@prisma/client',
		'@prisma/client/**',
		'@/generated/prisma',
		'@/generated/prisma/**',
		'**/generated/prisma/**',
		'pg',
		'pg/**',
		'postgres',
		'@neondatabase/serverless',
		'drizzle-orm',
		'drizzle-orm/**',
		'kysely',
		'knex',
		'typeorm',
		'sequelize',
		'@supabase/postgrest-js'
	],
	allowTypeImports: true,
	message:
		"Import `db` from '@/server/db/client' instead — that file is the only place the Prisma client is constructed, and raw database drivers have no place in src/. See docs/rules/database.md."
}

// Supabase is auth only (docs/rules/auth.md). The wrappers in src/lib/supabase/
// hand out a client typed to its auth surface, so `.from()` and `.rpc()` are
// type errors; importing the SDK directly would be the way around that type,
// which is why it is banned everywhere else. proxy.ts is the one other holder:
// it refreshes the session cookie before any wrapper could run.
const SUPABASE_IMPORTS = {
	group: ['@supabase/supabase-js', '@supabase/ssr', '@supabase/**'],
	allowTypeImports: true,
	message:
		"Use createServerSupabaseClient / createSecretKeyClient from '@/lib/supabase/*' instead — Supabase is auth only here; application data goes through Prisma. See docs/rules/auth.md."
}

const LOGGER_IMPORTS = {
	group: ['pino', 'pino/**'],
	message:
		"Import log from '@/server/lib/logger' instead — the shared Pino wrapper owns correlation and redaction. See docs/rules/logging.md."
}

const eslintConfig = defineConfig([
	...outsideMobile([...nextVitals, ...nextTypescript]),
	...expoConfig.map((config) => ({ ...config, basePath: MOBILE })),
	// .claude/worktrees/ holds other Claude Code sessions' full checkouts. It's
	// git-ignored (via .git/info/exclude), but flat config doesn't read ignore
	// files, so without this `pnpm lint` lints every one of them.
	// .agents/skills/ holds third-party skills installed through skills-lock.json
	// (linked into .claude/skills/). Their scripts are vendored, not ours to
	// restyle, and a skill update would otherwise fail the build.
	globalIgnores([
		'**/.next/**',
		'**/out/**',
		'**/build/**',
		'**/next-env.d.ts',
		'apps/web/src/generated/**',
		'**/playwright-report/**',
		'**/test-results/**',
		'.claude/worktrees/**',
		'.agents/skills/**',
		`${MOBILE}/.expo/**`,
		`${MOBILE}/ios/**`,
		`${MOBILE}/android/**`,
		`${MOBILE}/expo-env.d.ts`
	]),
	{
		// eslint-config-next looks for pages/ and app/ under the lint root; the
		// Next.js app is a workspace, not the repo root.
		// eslint-plugin-react can't detect React from the root, where no app's
		// copy lives; both apps are on React 19.3.
		settings: { next: { rootDir: 'apps/web' }, react: { version: '19.3' } }
	},
	{
		// See docs/rules/code-quality.md for the rationale behind both rules.
		// TypeScript files only: `any` is a TypeScript idea, and the TypeScript
		// plugin is registered for them alone in each app's config.
		files: ['**/*.{ts,tsx,mts,cts}'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'error'
		}
	},
	{
		// no-console scoped to application code only — scripts/ is
		// operational tooling that legitimately prints to stdout.
		files: ['apps/web/src/**/*.{ts,tsx}'],
		rules: { 'no-console': 'error' }
	},
	{
		// env.ts is shared with client code and must report invalid boot config
		// before a server-only logger can be imported.
		files: [
			'apps/web/src/lib/env.ts',
			'apps/web/instrumentation*.ts',
			'apps/web/sentry.*.config.ts'
		],
		rules: {
			'no-console': ['error', { allow: ['warn', 'error'] }]
		}
	},
	{
		// Icons come from '@/components/ui/icons', AI SDKs from 'apps/web/src/server/ai/*',
		// the Prisma client from 'apps/web/src/server/db/client.ts' and Supabase from
		// 'apps/web/src/lib/supabase/*' — never from the package directly. See
		// docs/rules/icons.md, ai-usage.md, database.md and auth.md. Same
		// enforcement shape as the logger rule below: one file owns the
		// dependency, the rest of the codebase imports the wrapper.
		//
		// All pattern groups live in ONE rule entry on purpose. ESLint flat
		// config resolves a rule by last-match-wins, so a second block
		// re-declaring `no-restricted-imports` over `src/**` would silently
		// replace this one rather than add to it — which is why each exemption
		// block below re-states every group that still applies instead of only
		// subtracting its own.
		files: ['apps/web/src/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						ICON_PROVIDER_IMPORTS,
						AI_SDK_IMPORTS,
						DATA_ACCESS_IMPORTS,
						SUPABASE_IMPORTS,
						LOGGER_IMPORTS
					]
				}
			]
		}
	},
	{
		files: ['apps/web/src/components/ui/icons.tsx'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [AI_SDK_IMPORTS, DATA_ACCESS_IMPORTS, SUPABASE_IMPORTS, LOGGER_IMPORTS] }
			]
		}
	},
	{
		// src/server/ai/* is where the AI SDKs are allowed to be imported, and
		// the only place trackAiCall is called. Every other ban still applies.
		files: ['apps/web/src/server/ai/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [ICON_PROVIDER_IMPORTS, DATA_ACCESS_IMPORTS, SUPABASE_IMPORTS, LOGGER_IMPORTS] }
			]
		}
	},
	{
		// The files that construct the Prisma client: the factory over the pg
		// adapter, and the app's one `db` built from it.
		files: ['apps/web/src/server/db/client.ts', 'apps/web/src/server/db/create-client.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [ICON_PROVIDER_IMPORTS, AI_SDK_IMPORTS, SUPABASE_IMPORTS, LOGGER_IMPORTS] }
			]
		}
	},
	{
		// The Supabase wrappers, and the proxy that refreshes the session before
		// any of them could run.
		files: ['apps/web/src/lib/supabase/**/*.ts', 'apps/web/src/proxy.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [ICON_PROVIDER_IMPORTS, AI_SDK_IMPORTS, DATA_ACCESS_IMPORTS, LOGGER_IMPORTS] }
			]
		}
	},
	{
		files: ['apps/web/src/server/lib/logger/logger.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [ICON_PROVIDER_IMPORTS, AI_SDK_IMPORTS, DATA_ACCESS_IMPORTS, SUPABASE_IMPORTS] }
			]
		}
	},
	{
		// The logger uses node:async_hooks and process.stdout — it can't run in
		// a browser bundle. It doesn't import `server-only` (that would throw in
		// the node:test suites that exercise it), so the boundary in
		// docs/rules/logging.md is enforced here instead: a `'use client'` file
		// reports errors through Sentry (instrumentation-client.ts), never the
		// logger.
		files: ['apps/web/src/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-syntax': ['error', LOGGER_IN_CLIENT_SYNTAX, AI_HOST_SYNTAX]
		}
	},
	{
		// The one file that calls OpenRouter, with fetch and no SDK, and the
		// one that reads its price list, which is not an AI call.
		files: ['apps/web/src/server/ai/**/*.ts', 'apps/web/src/server/lib/ai-usage/pricing.ts'],
		rules: {
			'no-restricted-syntax': ['error', LOGGER_IN_CLIENT_SYNTAX]
		}
	}
])

// ---- The mobile app (apps/mobile) ---------------------------------------
// The same shape as the web's rules: one file owns each SDK, everything else
// imports the wrapper. Supabase is sign-in only (src/lib/supabase.ts), Sentry
// is wrapped by src/lib/observability.ts and the logger, PostHog by
// src/lib/analytics.ts, and only src/lib/env.ts reads process.env — Expo
// inlines EXPO_PUBLIC_* only where it is spelled out statically.

const MOBILE_SUPABASE = {
	group: ['@supabase/**'],
	message:
		"Sign in through '@/lib/supabase' instead — Supabase is auth only, and Kept's data comes through the API (@/lib/api). See docs/rules/auth.md."
}
const MOBILE_SENTRY = {
	group: ['@sentry/**'],
	message: "Report through '@/lib/observability' (captureError) or log with '@/lib/logger'."
}
const MOBILE_POSTHOG = {
	group: ['posthog-react-native', 'posthog-react-native/**'],
	message:
		"Track through '@/lib/analytics' — its typed event list is the taxonomy. See docs/rules/analytics.md."
}
const MOBILE_ENV = {
	object: 'process',
	property: 'env',
	message:
		"Read configuration from '@/lib/env' — Expo only inlines EXPO_PUBLIC_* spelled out there."
}
const mobileImports = (...patterns) => ['error', { patterns }]

eslintConfig.push(
	{
		// Lint runs from the repo root; the resolver needs the app's tsconfig to
		// know its `@/` alias. import/namespace can't follow the re-exported
		// enums of Expo's packages, and TypeScript checks the same thing exactly.
		basePath: MOBILE,
		files: ['**/*.{ts,tsx}'],
		settings: { 'import/resolver': { typescript: { project: `${MOBILE}/tsconfig.json` } } },
		rules: { 'import/namespace': 'off' }
	},
	{
		basePath: MOBILE,
		files: ['src/**/*.{ts,tsx}'],
		rules: {
			'no-console': 'error',
			'no-restricted-properties': ['error', MOBILE_ENV],
			'no-restricted-imports': mobileImports(MOBILE_SUPABASE, MOBILE_SENTRY, MOBILE_POSTHOG)
		}
	},
	{ basePath: MOBILE, files: ['src/lib/env.ts'], rules: { 'no-restricted-properties': 'off' } },
	{
		basePath: MOBILE,
		files: ['src/lib/supabase.ts'],
		rules: { 'no-restricted-imports': mobileImports(MOBILE_SENTRY, MOBILE_POSTHOG) }
	},
	{
		basePath: MOBILE,
		files: ['src/lib/logger.ts', 'src/lib/observability.ts'],
		rules: {
			'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
			'no-restricted-imports': mobileImports(MOBILE_SUPABASE, MOBILE_POSTHOG)
		}
	},
	{
		basePath: MOBILE,
		files: ['src/lib/analytics.ts', 'src/app/_layout.tsx'],
		rules: { 'no-restricted-imports': mobileImports(MOBILE_SUPABASE, MOBILE_SENTRY) }
	}
)

export default eslintConfig
