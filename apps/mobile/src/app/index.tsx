import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ErrorState } from '@/components/error-state'
import { FinishSetup } from '@/components/finish-setup'
import { TodayView } from '@/components/today-view'
import { useMe, useToday } from '@/hooks/use-kept-data'
import { identify } from '@/lib/analytics'
import { colors } from '@/lib/theme'
import { Screen } from '@/components/ui/screen'

// Home, once signed in: Today, or the way back to setup on the web while
// setup has steps left (the web sends them to /setup the same way).
export default function HomeScreen() {
	const me = useMe()
	const isSetUp = me.data != null && me.data.setupStep == null
	const today = useToday({ enabled: isSetUp })

	const userId = me.data?.user.id
	useEffect(() => {
		if (userId != null) identify(userId)
	}, [userId])

	if (me.isPending) return <Loading />
	if (me.isError) {
		return (
			<Screen>
				<ErrorState error={me.error} onRetry={() => void me.refetch()} />
			</Screen>
		)
	}
	if (!isSetUp) return <FinishSetup onRefresh={() => void me.refetch()} />
	return (
		<TodayView
			today={today}
			reminderTime={me.data.reminderTime}
			onRefresh={() => {
				void me.refetch()
				void today.refetch()
			}}
		/>
	)
}

function Loading() {
	return (
		<View style={styles.loading}>
			<ActivityIndicator color={colors.accent} />
		</View>
	)
}

const styles = StyleSheet.create({
	loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }
})
