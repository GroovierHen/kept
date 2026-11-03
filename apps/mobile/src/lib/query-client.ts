import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query'
import { shouldRetry } from './api'
import { isOffline } from './network'

/**
 * Server state for the app (docs/rules/state-management.md): every query's
 * data comes from lib/api.ts, which throws on any failure, so a query is
 * either data or an error the screen shows.
 *
 * - `networkMode: 'always'`: a request made offline fails at once with
 *   `offline` and the screen says so, rather than a skeleton that never ends.
 * - Reconnecting, or coming back to the app, refetches what is stale.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { networkMode: 'always', retry: shouldRetry, staleTime: 30_000, gcTime: 5 * 60_000 },
		mutations: { networkMode: 'always', retry: false }
	}
})

onlineManager.setEventListener((setOnline) =>
	NetInfo.addEventListener((state) => setOnline(!isOffline(state)))
)

focusManager.setEventListener((setFocused) => {
	const subscription = AppState.addEventListener('change', (state) =>
		setFocused(state === 'active')
	)
	return () => subscription.remove()
})
