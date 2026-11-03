import * as Sentry from '@sentry/react-native'

/**
 * The app's one way to record what happened. A phone has no log stream
 * anyone reads, so each line becomes a Sentry breadcrumb: the trail attached
 * to the next error report. In development it also prints to Metro's console.
 * Context is ids, codes and counts only — never a token, email or anything a
 * person typed (docs/rules/logging.md).
 */
type Level = 'info' | 'warn' | 'error'
type Context = Record<string, string | number | boolean | null | undefined | string[]>

// The one place the app prints; ESLint allows console here only.
const PRINT: Record<Level, (...args: unknown[]) => void> = {
	info: console.info,
	warn: console.warn,
	error: console.error
}

function record(level: Level, message: string, context?: Context) {
	Sentry.addBreadcrumb({
		category: 'log',
		level: level === 'warn' ? 'warning' : level,
		message,
		data: context
	})
	if (__DEV__) PRINT[level](`[${level}] ${message}`, context ?? '')
}

export const log = {
	info: (message: string, context?: Context) => record('info', message, context),
	warn: (message: string, context?: Context) => record('warn', message, context),
	error: (message: string, context?: Context) => record('error', message, context)
}
