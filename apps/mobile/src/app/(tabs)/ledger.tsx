import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ErrorState } from '@/components/error-state'
import { LedgerView } from '@/components/ledger/ledger-view'
import { SignOutButton } from '@/components/sign-out-button'
import { Screen } from '@/components/ui/screen'
import { useLedger } from '@/hooks/use-kept-data'
import { colors } from '@/lib/theme'

export default function LedgerScreen() {
	const ledger = useLedger()
	if (ledger.isPending) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator color={colors.accent} />
			</View>
		)
	}
	return (
		<Screen onRefresh={() => void ledger.refetch()} isRefreshing={ledger.isRefetching}>
			{ledger.isError ? (
				<ErrorState error={ledger.error} onRetry={() => void ledger.refetch()} />
			) : (
				<LedgerView ledger={ledger.data} />
			)}
			<SignOutButton />
		</Screen>
	)
}

const styles = StyleSheet.create({
	loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }
})
