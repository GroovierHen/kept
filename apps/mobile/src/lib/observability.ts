import * as Sentry from '@sentry/react-native'
import * as Updates from 'expo-updates'
import { env, invalidEnvNames } from './env'

/**
 * Error reporting. Off until EXPO_PUBLIC_SENTRY_DSN is set. Reports carry the
 * stack, the screen and the update that was running — never who the person
 * is: no PII, the same line the web draws (docs/rules/analytics.md).
 */
export function initObservability(): void {
	Sentry.init({
		dsn: env.EXPO_PUBLIC_SENTRY_DSN,
		enabled: env.EXPO_PUBLIC_SENTRY_DSN != null,
		sendDefaultPii: false,
		tracesSampleRate: 0.1
	})
	const scope = Sentry.getGlobalScope()
	// Which over-the-air update a crash came from (docs.expo.dev/guides/using-sentry).
	if (Updates.updateId != null) scope.setTag('expo-update-id', Updates.updateId)
	scope.setTag('expo-is-embedded-update', Updates.isEmbeddedLaunch)
	if (invalidEnvNames.length > 0) {
		Sentry.captureMessage(`Invalid environment variables: ${invalidEnvNames.join(', ')}`, 'warning')
	}
}

/** For an error a screen didn't expect; an ApiError the screen shows is not one. */
export function captureError(error: unknown): void {
	Sentry.captureException(error)
}

export const wrapRoot = Sentry.wrap
