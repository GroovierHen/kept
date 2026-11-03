import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { PostHogProvider } from 'posthog-react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque'
import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	useFonts
} from '@expo-google-fonts/inter'
import { SessionProvider, useSession } from '@/hooks/use-session'
import { posthog, track } from '@/lib/analytics'
import { initObservability, wrapRoot } from '@/lib/observability'
import { queryClient } from '@/lib/query-client'
import { colors } from '@/lib/theme'

initObservability()
void SplashScreen.preventAutoHideAsync()

function Routes() {
	const session = useSession()
	const [fontsLoaded] = useFonts({
		BricolageGrotesque_700Bold,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold
	})
	const isReady = fontsLoaded && session !== 'loading'

	useEffect(() => {
		if (isReady) void SplashScreen.hideAsync()
	}, [isReady])

	if (!isReady) return null
	return (
		<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
			<Stack.Protected guard={session === 'signedIn'}>
				<Stack.Screen name="index" />
			</Stack.Protected>
			<Stack.Protected guard={session === 'signedOut'}>
				<Stack.Screen name="sign-in" />
			</Stack.Protected>
		</Stack>
	)
}

function RootLayout() {
	useEffect(() => track('app_opened'), [])
	const app = (
		<QueryClientProvider client={queryClient}>
			<SessionProvider>
				<StatusBar style="dark" />
				<Routes />
			</SessionProvider>
		</QueryClientProvider>
	)
	return (
		<SafeAreaProvider>
			{posthog == null ? (
				app
			) : (
				<PostHogProvider client={posthog} autocapture={false}>
					{app}
				</PostHogProvider>
			)}
		</SafeAreaProvider>
	)
}

export default wrapRoot(RootLayout)
