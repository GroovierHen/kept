import type { BrowserOptions } from '@sentry/nextjs'

// Sentry 11 replaced `sendDefaultPii` with `dataCollection`, and left unset it
// now collects user info, cookies, headers and every request and response
// body — a sign-in form's body is a password. Each Sentry.init (browser,
// server, edge) passes this instead, so an error report carries the stack and
// the route, not the person: no PII, the same as docs/rules/analytics.md asks
// of PostHog. Query parameters stay; Sentry filters tokens out of them.
export const SENTRY_DATA_COLLECTION = {
	userInfo: false,
	cookies: false,
	httpHeaders: false,
	httpBodies: [],
	urlQueryParams: true,
	graphQL: { document: false, variables: false },
	// The planner's prompts carry what people wrote about their goals.
	genAI: { inputs: false, outputs: false }
} satisfies NonNullable<BrowserOptions['dataCollection']>
