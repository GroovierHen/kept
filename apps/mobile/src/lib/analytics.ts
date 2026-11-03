import PostHog from 'posthog-react-native'
import { Platform } from 'react-native'
import type { ApiErrorCode } from './api'
import { env } from './env'

/**
 * Product analytics, through this typed list only (docs/rules/analytics.md):
 * the same object_action names the web sends, properties that are ids, enums
 * or booleans, never free text or PII. Off until EXPO_PUBLIC_POSTHOG_KEY is set.
 */
export type ScreenName = 'sign_in' | 'today' | 'finish_setup'
export type Permission = 'notifications'

type EventProps = {
	app_opened: Record<string, never>
	page_viewed: { page: ScreenName }
	permission_prompted: { permission: Permission }
	permission_approved: { permission: Permission }
	permission_denied: { permission: Permission }
	error_shown: { page: ScreenName; error_type: ApiErrorCode | 'unknown' }
}

export const posthog =
	env.EXPO_PUBLIC_POSTHOG_KEY == null
		? null
		: new PostHog(env.EXPO_PUBLIC_POSTHOG_KEY, {
				host: env.EXPO_PUBLIC_POSTHOG_HOST,
				personProfiles: 'identified_only',
				captureAppLifecycleEvents: false
			})

export function track<E extends keyof EventProps>(
	event: E,
	...[props]: EventProps[E] extends Record<string, never> ? [] : [EventProps[E]]
): void {
	posthog?.capture(event, { ...props, platform: Platform.OS, surface: 'mobile' })
}

/** The Supabase user id only — the same distinct id the web uses, never an email. */
export function identify(userId: string): void {
	posthog?.identify(userId)
}

export function resetIdentity(): void {
	posthog?.reset()
}
